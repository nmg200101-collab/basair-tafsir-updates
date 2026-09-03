package com.basair.samsungarabic;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;

public class ArabicCoreBootReceiver extends BroadcastReceiver {
    private static final String CORE_PACKAGE = "com.samsung.Arabic_Core_Theme01";
    private static final String THEME_CENTER = "com.samsung.android.themecenter";
    private static final String ACTION_REAPPLY = "com.samsung.android.theme.themecenter.THEME_REAPPLY";

    @Override public void onReceive(Context context, Intent intent) {
        if (!isCoreInstalled(context)) return;
        tryReapply(context);
    }

    private boolean isCoreInstalled(Context context) {
        try {
            context.getPackageManager().getPackageInfo(CORE_PACKAGE, 0);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    private void tryReapply(Context context) {
        try {
            Intent i = new Intent(ACTION_REAPPLY);
            i.setPackage(THEME_CENTER);
            i.putExtra("packageName", CORE_PACKAGE);
            i.putExtra("package", CORE_PACKAGE);
            i.putExtra("themePackage", CORE_PACKAGE);
            context.sendBroadcast(i);
        } catch (Throwable ignored) {}

        try {
            Intent i2 = new Intent(ACTION_REAPPLY);
            i2.putExtra("packageName", CORE_PACKAGE);
            i2.putExtra("package", CORE_PACKAGE);
            i2.putExtra("themePackage", CORE_PACKAGE);
            context.sendBroadcast(i2);
        } catch (Throwable ignored) {}
    }
}
