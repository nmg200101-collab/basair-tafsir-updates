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

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import rikka.shizuku.Shizuku;

public class MainActivity extends Activity {
    private static final int REQ_SHIZUKU=4242;
    private static final String CORE_PACKAGE="com.samsung.Arabic_Core_Theme01";
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private IPrivilegedService service; private boolean binding;
    private TextView deviceBox, frameworkState, settingsState, systemUiState, localeState, themeState, logBox;
    private SharedPreferences prefs;

    private final Shizuku.OnRequestPermissionResultListener permissionListener=(requestCode,grantResult)->{
        if(requestCode==REQ_SHIZUKU && grantResult==PackageManager.PERMISSION_GRANTED) bindPrivileged();
        else if(requestCode==REQ_SHIZUKU) log("لم تُمنح صلاحية Shizuku. سيبقى فحص الجهاز الأساسي متاحًا، لكن الإصلاح العميق يحتاج الصلاحية.");
    };
    private final Shizuku.OnBinderReceivedListener binderReceivedListener=this::refreshPrivilege;
    private final Shizuku.OnBinderDeadListener binderDeadListener=()->runOnUiThread(()->{service=null;binding=false;log("توقفت خدمة Shizuku.");});
    private final ServiceConnection connection=new ServiceConnection(){
        @Override public void onServiceConnected(ComponentName n, IBinder b){service=IPrivilegedService.Stub.asInterface(b);binding=false;runOnUiThread(()->{log("محرك الفحص متصل."); runCheck();});}
        @Override public void onServiceDisconnected(ComponentName n){service=null;binding=false;}
    };

    @Override protected void onCreate(Bundle b){super.onCreate(b);prefs=getSharedPreferences("arabic_core",MODE_PRIVATE);setContentView(buildUi());
        Shizuku.addRequestPermissionResultListener(permissionListener);Shizuku.addBinderReceivedListenerSticky(binderReceivedListener);Shizuku.addBinderDeadListener(binderDeadListener);
        showBasicDevice();
    }

    private View buildUi(){int p=dp(18);LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(p,p,p,p);root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        TextView t=text("Samsung Arabic Universal",25,true);root.addView(t);
        TextView s=text("Arabic Core Theme · SM-G998U · Android 15 · One UI 7",15,false);s.setPadding(0,dp(4),0,dp(14));root.addView(s);
        deviceBox=card("الجهاز: جارٍ القراءة…");root.addView(deviceBox);
        TextView h=text("حالة التعريب",19,true);h.setPadding(0,dp(16),0,dp(5));root.addView(h);
        frameworkState=state("Framework Arabic",false);settingsState=state("Settings Arabic",false);systemUiState=state("SystemUI Arabic",false);localeState=state("Arabic locale",false);themeState=state("Arabic Core Theme",false);
        root.addView(frameworkState);root.addView(settingsState);root.addView(systemUiState);root.addView(localeState);root.addView(themeState);
        root.addView(button("فحص حالة التعريب",v->prepareAndCheck()));
        root.addView(button("إصلاح التعريب",v->repairArabic()));
        root.addView(button("إعادة تطبيق Arabic Core",v->reapplyCore()));
        root.addView(button("فتح ثيماتي مباشرة",v->openMyThemes()));
        root.addView(button("الرجوع للوضع السابق / الافتراضي",v->rollback()));
        root.addView(button("فتح إعدادات اللغة",v->openLanguage()));
        logBox=card("الحالة: جاهز للفحص.");logBox.setTextDirection(View.TEXT_DIRECTION_ANY_RTL);logBox.setTextIsSelectable(true);logBox.setPadding(dp(14),dp(14),dp(14),dp(40));root.addView(logBox);
        ScrollView sv=new ScrollView(this);sv.addView(root);return sv;
    }
    private TextView text(String x,int z,boolean bold){TextView v=new TextView(this);v.setText(x);v.setTextSize(z);v.setGravity(Gravity.RIGHT);if(bold)v.setTypeface(Typeface.DEFAULT_BOLD);return v;}
    private TextView card(String x){TextView v=text(x,14,false);v.setPadding(dp(14),dp(12),dp(14),dp(12));v.setBackgroundResource(android.R.drawable.dialog_holo_light_frame);return v;}
    private TextView state(String name,boolean ok){TextView v=text((ok?"✓ ":"… ")+name,16,true);v.setPadding(dp(8),dp(5),dp(8),dp(5));return v;}
    private Button button(String x,View.OnClickListener l){Button b=new Button(this);b.setText(x);b.setAllCaps(false);b.setTextSize(16);b.setOnClickListener(l);LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2);lp.setMargins(0,dp(5),0,dp(5));b.setLayoutParams(lp);return b;}

    private void showBasicDevice(){String oneui="غير متاح بدون فحص Shell";deviceBox.setText("الموديل: "+Build.MODEL+"\nAndroid: "+Build.VERSION.RELEASE+" · SDK "+Build.VERSION.SDK_INT+"\nBuild: "+Build.DISPLAY+"\nOne UI: "+oneui);}
    private void prepareAndCheck(){if(!"samsung".equalsIgnoreCase(Build.MANUFACTURER)){log("هذا الإصدار المرجعي مخصص لسامسونج فقط.");return;}refreshPrivilege();if(service!=null)runCheck();}
    private void refreshPrivilege(){runOnUiThread(()->{try{if(Shizuku.isPreV11()){log("Shizuku قديم.");return;}if(Shizuku.checkSelfPermission()!=PackageManager.PERMISSION_GRANTED){if(!Shizuku.shouldShowRequestPermissionRationale()){log("اسمح للتطبيق داخل Shizuku لإجراء الفحص والإصلاح.");Shizuku.requestPermission(REQ_SHIZUKU);}else log("صلاحية Shizuku مرفوضة.");return;}bindPrivileged();}catch(Throwable t){log("Shizuku غير جاهز. يمكن تشغيله عبر Wireless debugging عند الحاجة.\n"+t.getMessage());}});}
    private void bindPrivileged(){if(service!=null||binding)return;binding=true;ComponentName c=new ComponentName(getPackageName(),PrivilegedService.class.getName());Shizuku.UserServiceArgs a=new Shizuku.UserServiceArgs(c).daemon(false).processNameSuffix("core").tag("samsung-arabic-universal").version(1).debuggable(BuildConfig.DEBUG);try{Shizuku.bindUserService(a,connection);}catch(Throwable t){binding=false;log("تعذر تشغيل محرك Shell: "+t.getMessage());}}
    private boolean ready(){if(service==null){prepareAndCheck();return false;}return true;}

    private void runCheck(){if(!ready())return;worker.execute(()->{try{String r=service.diagnosticState();runOnUiThread(()->renderDiagnostic(r));}catch(Throwable t){runOnUiThread(()->log("فشل الفحص: "+t));}});}
    private boolean enabled(String r,String p){int i=r.indexOf("====OVERLAY:"+p+"====");if(i<0)return false;int j=r.indexOf("====",i+8);String q=j>i?r.substring(i,j):r.substring(i);return q.contains("STATE_ENABLED")||q.contains("STATE_ENABLED_IMMUTABLE");}
    private String value(String r,String k){String m=k+"=";int i=r.indexOf(m);if(i<0)return "?";int e=r.indexOf('\n',i);if(e<0)e=r.length();return r.substring(i+m.length(),e).trim();}
    private void renderDiagnostic(String r){String model=value(r,"MODEL"),and=value(r,"ANDROID"),sdk=value(r,"SDK"),one=value(r,"ONEUI"),csc=value(r,"CSC"),build=value(r,"BUILD"),loc=value(r,"LOCALES"),active=value(r,"ACTIVE_THEME"),installed=value(r,"CORE_INSTALLED");
        deviceBox.setText("الموديل: "+model+"\nAndroid: "+and+" · SDK "+sdk+"\nOne UI: "+one+"\nCSC: "+csc+"\nBuild: "+build);
        mark(frameworkState,"Framework Arabic",enabled(r,"cdma.yemen.tool.android"));mark(settingsState,"Settings Arabic",enabled(r,"cdma.yemen.tool.settings"));mark(systemUiState,"SystemUI Arabic",enabled(r,"cdma.yemen.tool.systemui"));mark(localeState,"Arabic locale",loc.startsWith("ar")||loc.contains("ar-YE"));mark(themeState,"Arabic Core Theme",CORE_PACKAGE.equals(active)||installed.startsWith("package:"));
        log("ACTIVE_THEME="+active+"\nLOCALES="+loc+"\n\n"+r);
    }
    private void mark(TextView v,String n,boolean ok){v.setText((ok?"✓ ":"✗ ")+n);}

    private void snapshotPrevious(){if(service==null)return;worker.execute(()->{try{String r=service.diagnosticState();String th=value(r,"ACTIVE_THEME"),loc=value(r,"LOCALES");if(th!=null&&!th.equals("null")&&!th.isEmpty()&&!CORE_PACKAGE.equals(th))prefs.edit().putString("previous_theme",th).apply();if(loc!=null&&!loc.equals("null")&&!loc.isEmpty())prefs.edit().putString("previous_locale",loc.split(",")[0]).apply();}catch(Throwable ignored){}});}
    private void repairArabic(){if(!ready())return;snapshotPrevious();worker.execute(()->{try{String a=service.setArabicLocale("ar-YE");String b=service.bestEffortReapply(CORE_PACKAGE);runOnUiThread(()->{log("تم تنفيذ محاولة الإصلاح.\n"+a+"\n"+b+"\nإذا منع One UI الإعادة التلقائية سيفتح التطبيق صفحة ثيماتي لتطبيق Arabic Core يدويًا.");openMyThemes();});}catch(Throwable t){runOnUiThread(()->{log("تعذر الإصلاح التلقائي: "+t);openMyThemes();});}});}
    private void reapplyCore(){if(!ready()){openMyThemes();return;}snapshotPrevious();worker.execute(()->{try{String r=service.bestEffortReapply(CORE_PACKAGE);runOnUiThread(()->{log("محاولة إعادة التطبيق:\n"+r);openMyThemes();});}catch(Throwable t){runOnUiThread(this::openMyThemes);}});}
    private void rollback(){if(!ready())return;String prev=prefs.getString("previous_theme","");String prevLoc=prefs.getString("previous_locale","");worker.execute(()->{try{StringBuilder sb=new StringBuilder();if(!prev.isEmpty())sb.append(service.bestEffortReapply(prev));else sb.append(service.applyDefaultTheme());if(!prevLoc.isEmpty())sb.append("\nLocale restore: ").append(service.setArabicLocale(prevLoc));runOnUiThread(()->{log("طلب الرجوع أُرسل. الثيم السابق المحفوظ: "+(prev.isEmpty()?"الافتراضي":prev)+"\n"+sb);openMyThemes();});}catch(Throwable t){runOnUiThread(()->log("تعذر الرجوع تلقائيًا: "+t));}});}

    private void openMyThemes(){try{Intent i=new Intent(Intent.ACTION_VIEW, Uri.parse("https://apps.samsung.com/theme/MyTheme"));i.setPackage("com.samsung.android.themestore");startActivity(i);}catch(Throwable e){try{Intent i=new Intent("com.samsung.android.action.themelaunch");i.setPackage("com.samsung.android.themestore");startActivity(i);}catch(Throwable x){log("تعذر فتح Galaxy Themes: "+x.getMessage());}}}
    private void openLanguage(){try{startActivity(new Intent(Settings.ACTION_LOCALE_SETTINGS));}catch(Throwable t){startActivity(new Intent(Settings.ACTION_SETTINGS));}}
    private void log(String x){if(logBox!=null)logBox.setText(x);}
    private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
    @Override protected void onDestroy(){Shizuku.removeRequestPermissionResultListener(permissionListener);Shizuku.removeBinderReceivedListener(binderReceivedListener);Shizuku.removeBinderDeadListener(binderDeadListener);worker.shutdownNow();super.onDestroy();}
}
