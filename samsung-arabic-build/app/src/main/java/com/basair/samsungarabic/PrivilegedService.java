package com.basair.samsungarabic;

import android.content.Context;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.os.LocaleList;

import androidx.annotation.Keep;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

public class PrivilegedService extends IPrivilegedService.Stub {
    public PrivilegedService() {}
    @Keep public PrivilegedService(Context context) {}

    @Override public String exec(String command) {
        Process process = null;
        try {
            process = new ProcessBuilder("/system/bin/sh", "-c", command).redirectErrorStream(true).start();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            try (InputStream in = process.getInputStream()) {
                byte[] buf = new byte[8192]; int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            }
            int code = process.waitFor();
            return "exit=" + code + "\n" + out.toString(StandardCharsets.UTF_8.name());
        } catch (Throwable t) {
            return "ERROR: " + t.getClass().getSimpleName() + ": " + t.getMessage();
        } finally { if (process != null) process.destroy(); }
    }

    private int currentUser() {
        String r = exec("am get-current-user");
        try { String[] a = r.trim().split("\\n"); return Integer.parseInt(a[a.length-1].trim()); }
        catch (Throwable ignored) { return 0; }
    }

    @Override public String diagnosticState() {
        int user = currentUser();
        String cmd =
            "echo MODEL=$(getprop ro.product.model); " +
            "echo ANDROID=$(getprop ro.build.version.release); " +
            "echo SDK=$(getprop ro.build.version.sdk); " +
            "echo ONEUI=$(getprop ro.build.version.oneui); " +
            "echo CSC=$(getprop ro.csc.sales_code); " +
            "echo BUILD=$(getprop ro.build.display.id); " +
            "echo FINGERPRINT=$(getprop ro.build.fingerprint); " +
            "echo LOCALES=$(settings get system system_locales); " +
            "echo ACTIVE_THEME=$(settings get system current_sec_active_themepackage); " +
            "echo CORE_INSTALLED=$(pm path com.samsung.Arabic_Core_Theme01 2>/dev/null | head -1); " +
            "for p in cdma.yemen.tool.android cdma.yemen.tool.settings cdma.yemen.tool.systemui; do " +
            "echo ====OVERLAY:$p====; cmd overlay dump --user " + user + " $p 2>&1 | grep -E 'mState|mTargetPackageName|mBaseCodePath|IDMAP|missing idmap' || true; done; " +
            "echo ====FILTERED_LIST====; cmd overlay list --user " + user + " | grep -E 'cdma\\.yemen\\.tool\\.(android|settings|systemui)' || true";
        return exec(cmd);
    }

    @Override public String setArabicLocale(String languageTag) {
        try {
            Locale locale = Locale.forLanguageTag(languageTag);
            Configuration config = new Configuration(Resources.getSystem().getConfiguration());
            config.setLocales(new LocaleList(locale));
            config.setLayoutDirection(locale);
            Class<?> amClass = Class.forName("android.app.ActivityManager");
            Method getService = amClass.getDeclaredMethod("getService");
            getService.setAccessible(true);
            Object iam = getService.invoke(null);
            if (iam == null) return "ERROR: ActivityManager unavailable";
            Method update = null;
            for (Method m : iam.getClass().getMethods()) {
                if (m.getName().equals("updatePersistentConfiguration") && m.getParameterTypes().length == 1) { update=m; break; }
            }
            if (update == null) {
                for (Method m : iam.getClass().getDeclaredMethods()) {
                    if (m.getName().equals("updatePersistentConfiguration") && m.getParameterTypes().length == 1) { m.setAccessible(true); update=m; break; }
                }
            }
            if (update == null) return "ERROR: updatePersistentConfiguration not found";
            update.invoke(iam, config);
            return "OK locale=" + languageTag;
        } catch (Throwable t) {
            return "REFLECTION_ERROR: " + t.getClass().getSimpleName() + ": " + t.getMessage() + "\n" +
                   exec("settings put system system_locales '" + languageTag.replace("'", "") + "'");
        }
    }

    @Override public String bestEffortReapply(String packageName) {
        String safe = packageName.replaceAll("[^A-Za-z0-9._]", "");
        return exec("am broadcast -a com.samsung.android.theme.themecenter.THEME_REAPPLY " +
                "--es packageName '" + safe + "' --es package '" + safe + "' --es themePackage '" + safe + "'");
    }

    @Override public String applyDefaultTheme() {
        return exec("am broadcast -a com.samsung.android.themecenter.APPLY_DEFAULT -p com.samsung.android.themecenter");
    }

    @Override public void destroy() { System.exit(0); }
}
