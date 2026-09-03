package com.basair.samsungarabic;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import rikka.shizuku.Shizuku;

public class MainActivity extends Activity {
    private static final int REQ_SHIZUKU=4242;
    private static final String CORE_PACKAGE="com.samsung.Arabic_Core_Theme01";
    private static final String TARGET_MODEL="SM-G998U";
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private IPrivilegedService service; private boolean binding; private boolean oneClickPending;
    private TextView deviceBox, frameworkState, settingsState, systemUiState, localeState, themeState, logBox;
    private SharedPreferences prefs;

    private final Shizuku.OnRequestPermissionResultListener permissionListener=(requestCode,grantResult)->{
        if(requestCode==REQ_SHIZUKU && grantResult==PackageManager.PERMISSION_GRANTED){log("تم منح الصلاحية. أُكمل التعريب تلقائيًا…");bindPrivileged();}
        else if(requestCode==REQ_SHIZUKU){oneClickPending=false;log("تعذر إكمال التعريب لأن Android لم يمنح صلاحية Shizuku.");}
    };
    private final Shizuku.OnBinderReceivedListener binderReceivedListener=this::refreshPrivilege;
    private final Shizuku.OnBinderDeadListener binderDeadListener=()->runOnUiThread(()->{service=null;binding=false;log("خدمة Shizuku غير نشطة. شغّلها مرة واحدة ثم اضغط «تعريب الهاتف».");});
    private final ServiceConnection connection=new ServiceConnection(){
        @Override public void onServiceConnected(ComponentName n, IBinder b){service=IPrivilegedService.Stub.asInterface(b);binding=false;runOnUiThread(()->{if(oneClickPending)continueOneClick();else runCheck();});}
        @Override public void onServiceDisconnected(ComponentName n){service=null;binding=false;}
    };

    @Override protected void onCreate(Bundle b){
        super.onCreate(b);prefs=getSharedPreferences("arabic_core",MODE_PRIVATE);setContentView(buildUi());
        Shizuku.addRequestPermissionResultListener(permissionListener);Shizuku.addBinderReceivedListenerSticky(binderReceivedListener);Shizuku.addBinderDeadListener(binderDeadListener);
        showBasicDevice();
    }

    private View buildUi(){int p=dp(18);LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(p,p,p,p);root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        TextView t=text("Samsung Arabic Universal",25,true);root.addView(t);
        TextView s=text("Arabic Core · SM-G998U · Android 15 · One UI 7",15,false);s.setPadding(0,dp(4),0,dp(14));root.addView(s);
        deviceBox=card("الجهاز: جارٍ القراءة…");root.addView(deviceBox);
        Button main=button("تعريب الهاتف",v->startOneClick());main.setTextSize(20);main.setMinHeight(dp(64));root.addView(main);
        TextView hint=text("زر واحد ينفذ: فحص الجهاز ← تثبيت Arabic Core المدمج ← تطبيقه ← تفعيل العربية ← فحص النتيجة.",14,false);hint.setPadding(dp(4),dp(5),dp(4),dp(12));root.addView(hint);
        TextView h=text("حالة التعريب",19,true);h.setPadding(0,dp(10),0,dp(5));root.addView(h);
        frameworkState=state("Framework Arabic",false);settingsState=state("Settings Arabic",false);systemUiState=state("SystemUI Arabic",false);localeState=state("Arabic locale",false);themeState=state("Arabic Core Theme",false);
        root.addView(frameworkState);root.addView(settingsState);root.addView(systemUiState);root.addView(localeState);root.addView(themeState);
        root.addView(button("فحص فقط",v->prepareAndCheck()));
        root.addView(button("إعادة تطبيق Arabic Core",v->reapplyCore()));
        root.addView(button("الرجوع للوضع السابق / الافتراضي",v->rollback()));
        root.addView(button("فتح ثيماتي عند الحاجة",v->openMyThemes()));
        logBox=card("الحالة: اضغط «تعريب الهاتف».");logBox.setTextDirection(View.TEXT_DIRECTION_ANY_RTL);logBox.setTextIsSelectable(true);logBox.setPadding(dp(14),dp(14),dp(14),dp(40));root.addView(logBox);
        ScrollView sv=new ScrollView(this);sv.addView(root);return sv;
    }
    private TextView text(String x,int z,boolean bold){TextView v=new TextView(this);v.setText(x);v.setTextSize(z);v.setGravity(Gravity.RIGHT);if(bold)v.setTypeface(Typeface.DEFAULT_BOLD);return v;}
    private TextView card(String x){TextView v=text(x,14,false);v.setPadding(dp(14),dp(12),dp(14),dp(12));v.setBackgroundResource(android.R.drawable.dialog_holo_light_frame);return v;}
    private TextView state(String name,boolean ok){TextView v=text((ok?"✓ ":"… ")+name,16,true);v.setPadding(dp(8),dp(5),dp(8),dp(5));return v;}
    private Button button(String x,View.OnClickListener l){Button b=new Button(this);b.setText(x);b.setAllCaps(false);b.setTextSize(16);b.setOnClickListener(l);LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2);lp.setMargins(0,dp(5),0,dp(5));b.setLayoutParams(lp);return b;}

    private void showBasicDevice(){deviceBox.setText("الموديل: "+Build.MODEL+"\nAndroid: "+Build.VERSION.RELEASE+" · SDK "+Build.VERSION.SDK_INT+"\nBuild: "+Build.DISPLAY);}
    private boolean targetOk(){return "samsung".equalsIgnoreCase(Build.MANUFACTURER)&&TARGET_MODEL.equalsIgnoreCase(Build.MODEL)&&Build.VERSION.SDK_INT==35;}

    private void startOneClick(){
        if(!targetOk()){log("هذه النسخة التجريبية مقفلة على SM-G998U / Android 15 (SDK 35) حتى لا تطبق ملفات غير مطابقة على جهاز آخر.");return;}
        oneClickPending=true;log("بدء التعريب… فحص صلاحية التنفيذ.");refreshPrivilege();
    }
    private void prepareAndCheck(){if(!"samsung".equalsIgnoreCase(Build.MANUFACTURER)){log("هذا الإصدار مخصص لسامسونج فقط.");return;}refreshPrivilege();if(service!=null)runCheck();}
    private void refreshPrivilege(){runOnUiThread(()->{try{
        if(!Shizuku.pingBinder()){log("Shizuku غير مشغّل. افتح Shizuku وشغّله عبر Wireless debugging مرة واحدة، ثم ارجع واضغط «تعريب الهاتف».");openShizuku();return;}
        if(Shizuku.isPreV11()){log("إصدار Shizuku قديم ويحتاج تحديثًا.");return;}
        if(Shizuku.checkSelfPermission()!=PackageManager.PERMISSION_GRANTED){log("سيظهر طلب صلاحية Shizuku مرة واحدة؛ وافق عليه ليكمل زر التعريب تلقائيًا.");Shizuku.requestPermission(REQ_SHIZUKU);return;}
        bindPrivileged();
    }catch(Throwable t){log("Shizuku غير جاهز: "+t.getMessage());openShizuku();}});}
    private void bindPrivileged(){if(service!=null||binding){if(service!=null&&oneClickPending)continueOneClick();return;}binding=true;ComponentName c=new ComponentName(getPackageName(),PrivilegedService.class.getName());Shizuku.UserServiceArgs a=new Shizuku.UserServiceArgs(c).daemon(false).processNameSuffix("core").tag("samsung-arabic-universal").version(2).debuggable(BuildConfig.DEBUG);try{Shizuku.bindUserService(a,connection);}catch(Throwable t){binding=false;log("تعذر تشغيل محرك Shell: "+t.getMessage());}}
    private boolean ready(){if(service==null){refreshPrivilege();return false;}return true;}

    private byte[] readCoreAsset() throws Exception {try(InputStream in=getAssets().open("arabic_core_theme.apk");ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[16384];int n;while((n=in.read(b))>0)out.write(b,0,n);return out.toByteArray();}}
    private void continueOneClick(){
        if(!oneClickPending||service==null)return;oneClickPending=false;
        log("جارٍ تنفيذ التعريب الكامل…");
        worker.execute(()->{try{
            String before=service.diagnosticState();savePrevious(before);
            byte[] core=readCoreAsset();
            String install=service.installCoreTheme(core);
            if(!(install.contains("Success")||install.contains("success"))){runOnUiThread(()->log("فشل تثبيت Arabic Core:\n"+install));return;}
            String apply1=service.bestEffortReapply(CORE_PACKAGE);
            Thread.sleep(1500);
            String mid=service.diagnosticState();
            boolean overlays=allCoreEnabled(mid);
            String apply2="";
            if(!overlays){apply2=service.bestEffortReapply(CORE_PACKAGE);Thread.sleep(1200);mid=service.diagnosticState();overlays=allCoreEnabled(mid);}
            final boolean applied=overlays;final String diagBeforeLocale=mid;final String a1=apply1;final String a2=apply2;
            prefs.edit().putBoolean("last_apply_needed_manual",!applied).apply();
            String locale=service.setArabicLocale("ar-YE");
            runOnUiThread(()->{
                renderDiagnostic(diagBeforeLocale);
                if(applied){log("✓ تم تثبيت Arabic Core وتطبيق مكونات Framework وSettings وSystemUI.\n✓ تم إرسال تفعيل العربية ar-YE.\n"+locale);}
                else{log("تم تثبيت Arabic Core وتفعيل العربية، لكن One UI لم يؤكد تفعيل المكونات تلقائيًا. سأفتح «ثيماتي» على Arabic Core؛ اضغط تطبيق فقط إذا ظهرت لك شاشة سامسونج.\n\n"+a1+"\n"+a2);openMyThemes();}
            });
        }catch(Throwable t){runOnUiThread(()->log("تعذر إكمال زر التعريب: "+t));}});
    }

    private void runCheck(){if(!ready())return;worker.execute(()->{try{String r=service.diagnosticState();runOnUiThread(()->renderDiagnostic(r));}catch(Throwable t){runOnUiThread(()->log("فشل الفحص: "+t));}});}
    private boolean enabled(String r,String p){int i=r.indexOf("====OVERLAY:"+p+"====");if(i<0)return false;int j=r.indexOf("====",i+12);String q=j>i?r.substring(i,j):r.substring(i);return q.contains("STATE_ENABLED")||q.contains("STATE_ENABLED_IMMUTABLE");}
    private boolean allCoreEnabled(String r){return enabled(r,"cdma.yemen.tool.android")&&enabled(r,"cdma.yemen.tool.settings")&&enabled(r,"cdma.yemen.tool.systemui");}
    private String value(String r,String k){String m=k+"=";int i=r.indexOf(m);if(i<0)return "?";int e=r.indexOf('\n',i);if(e<0)e=r.length();return r.substring(i+m.length(),e).trim();}
    private void renderDiagnostic(String r){String model=value(r,"MODEL"),and=value(r,"ANDROID"),sdk=value(r,"SDK"),one=value(r,"ONEUI"),csc=value(r,"CSC"),build=value(r,"BUILD"),loc=value(r,"LOCALES"),active=value(r,"ACTIVE_THEME"),installed=value(r,"CORE_INSTALLED");
        deviceBox.setText("الموديل: "+model+"\nAndroid: "+and+" · SDK "+sdk+"\nOne UI: "+one+"\nCSC: "+csc+"\nBuild: "+build);
        mark(frameworkState,"Framework Arabic",enabled(r,"cdma.yemen.tool.android"));mark(settingsState,"Settings Arabic",enabled(r,"cdma.yemen.tool.settings"));mark(systemUiState,"SystemUI Arabic",enabled(r,"cdma.yemen.tool.systemui"));mark(localeState,"Arabic locale",loc.startsWith("ar")||loc.contains("ar-YE"));mark(themeState,"Arabic Core Theme",CORE_PACKAGE.equals(active)||installed.startsWith("package:"));
    }
    private void mark(TextView v,String n,boolean ok){v.setText((ok?"✓ ":"✗ ")+n);}
    private void savePrevious(String r){String th=value(r,"ACTIVE_THEME"),loc=value(r,"LOCALES");SharedPreferences.Editor e=prefs.edit();if(th!=null&&!th.equals("null")&&!th.equals("?")&&!th.isEmpty()&&!CORE_PACKAGE.equals(th))e.putString("previous_theme",th);if(loc!=null&&!loc.equals("null")&&!loc.equals("?")&&!loc.isEmpty())e.putString("previous_locale",loc.split(",")[0]);e.apply();}

    private void reapplyCore(){if(!ready())return;worker.execute(()->{try{String r=service.bestEffortReapply(CORE_PACKAGE);Thread.sleep(1000);String d=service.diagnosticState();runOnUiThread(()->{renderDiagnostic(d);log("تمت محاولة إعادة التطبيق.\n"+r);if(!allCoreEnabled(d))openMyThemes();});}catch(Throwable t){runOnUiThread(()->log("فشل إعادة التطبيق: "+t));}});}
    private void rollback(){if(!ready())return;String prev=prefs.getString("previous_theme","");String prevLoc=prefs.getString("previous_locale","");worker.execute(()->{try{StringBuilder sb=new StringBuilder();if(!prev.isEmpty())sb.append(service.bestEffortReapply(prev));else sb.append(service.applyDefaultTheme());if(!prevLoc.isEmpty())sb.append("\nLocale restore: ").append(service.setArabicLocale(prevLoc));runOnUiThread(()->log("تم إرسال طلب الرجوع إلى: "+(prev.isEmpty()?"الثيم الافتراضي":prev)+"\n"+sb));}catch(Throwable t){runOnUiThread(()->log("تعذر الرجوع تلقائيًا: "+t));}});}

    private void openShizuku(){try{Intent i=getPackageManager().getLaunchIntentForPackage("moe.shizuku.privileged.api");if(i!=null)startActivity(i);}catch(Throwable ignored){}}
    private void openMyThemes(){try{Intent i=new Intent(Intent.ACTION_VIEW, Uri.parse("https://apps.samsung.com/theme/MyTheme"));i.setPackage("com.samsung.android.themestore");startActivity(i);}catch(Throwable e){try{Intent i=new Intent("com.samsung.android.action.themelaunch");i.setPackage("com.samsung.android.themestore");startActivity(i);}catch(Throwable x){log("تعذر فتح Galaxy Themes: "+x.getMessage());}}}
    private void log(String x){if(logBox!=null)logBox.setText(x);}
    private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
    @Override protected void onDestroy(){Shizuku.removeRequestPermissionResultListener(permissionListener);Shizuku.removeBinderReceivedListener(binderReceivedListener);Shizuku.removeBinderDeadListener(binderDeadListener);worker.shutdownNow();super.onDestroy();}
}
