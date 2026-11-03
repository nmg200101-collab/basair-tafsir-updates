package p86.runtime.lab;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;

/**
 * Experimental offline visual integration host.
 * It is NOT the protected V655 Android activity and has no real AV bridges.
 * No protected runtime content or owner keys are committed to GitHub.
 */
public final class V655VisualLabActivity extends Activity {
    private static final String[] HOSTS = {
        "tilawa.p86.invalid", "hifz.p86.invalid"
    };
    private final WebView[] readers = new WebView[2];
    private final boolean[] ready = new boolean[2];
    private final boolean[] checking = new boolean[2];
    private FrameLayout stage;
    private TextView status;
    private int active = -1;
    private boolean busy = false;
    private boolean storageBusy = false;
    private long startedMs = 0;
    private int cold = 0, warm = 0;
    private final StringBuilder events = new StringBuilder();
    private static final int MAX_READER_POLLS = 54;
    private static final long POLL_MS = 150;

    @Override public void onCreate(Bundle bundle) {
        super.onCreate(bundle);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(247,244,237));
        LinearLayout bar = new LinearLayout(this);
        Button t = new Button(this); t.setText("تلاوة");
        Button h = new Button(this); h.setText("حفظ");
        Button storage = new Button(this); storage.setText("فحص العزل");
        Button copy = new Button(this); copy.setText("نسخ");
        bar.addView(t,new LinearLayout.LayoutParams(0,-2,1));
        bar.addView(h,new LinearLayout.LayoutParams(0,-2,1));
        bar.addView(storage,new LinearLayout.LayoutParams(0,-2,1));
        bar.addView(copy,new LinearLayout.LayoutParams(0,-2,1));
        status = new TextView(this);
        status.setPadding(14,10,14,12);
        status.setTextSize(13);
        status.setText("P86.8 فحص مرئي مستقل — دون تشغيل الصوت أو التسميع");
        stage = new FrameLayout(this);
        root.addView(bar);
        root.addView(status);
        root.addView(stage,new LinearLayout.LayoutParams(-1,0,1));
        setContentView(root);
        t.setOnClickListener(v -> request(0));
        h.setOnClickListener(v -> request(1));
        storage.setOnClickListener(v -> probeStorage());
        copy.setOnClickListener(v -> {
            ClipboardManager mgr=(ClipboardManager)getSystemService(Context.CLIPBOARD_SERVICE);
            if(mgr!=null){
                mgr.setPrimaryClip(ClipData.newPlainText("P86.8 visual lab",events.toString()));
                status.setText("تم نسخ السجل المختصر. لا تُرسل ملفات كبيرة.");
            }
        });
        request(0);
    }

    private void request(int target) {
        if(busy) {status.setText("انتقال آخر قيد التنفيذ؛ لن تتداخل الجلسات");return;}
        if(target==active && ready[target]) {
            status.setText("القارئ المعروض بالفعل: "+name(target));
            return;
        }
        startedMs=SystemClock.elapsedRealtime();
        busy=true;
        status.setText("جارٍ تحضير "+name(target)+" — تجربة بدون جسور صوت");
        final int prev=active;
        if(prev<0 || readers[prev]==null) {
            proceed(target);
            return;
        }
        WebView old=readers[prev];
        // No native microphone, speech, or voice bridge exists in this lab.
        // Pause HTML media before switching; this is NOT a V655 audio guarantee.
        old.evaluateJavascript(
            "(function(){try{document.querySelectorAll('audio,video').forEach(function(x){x.pause()});"
            +"if(window.speechSynthesis)window.speechSynthesis.cancel();return true}catch(e){return false}})()",
            answer -> {
                if(!busy) return;
                if(!"true".equals(answer)){
                    fail("تعذّر تأكيد إيقاف وسائط HTML؛ رُفض الانتقال");
                    return;
                }
                proceed(target);
            });
    }

    private void proceed(int target){
        WebView next=readers[target];
        if(next!=null) {
            if(ready[target]) {confirmAndShow(target,true);return;}
            if(!checking[target]) {checking[target]=true;poll(target,0,false);}
            return;
        }
        create(target);
        checking[target]=true;
        readers[target].loadUrl(index(target));
    }

    private static String index(int target) {
        return "https://"+HOSTS[target]+"/index.html";
    }
    private static String name(int target) {return target==0?"التلاوة":"الحفظ";}

    private void create(int target){
        WebView v=new WebView(this);
        readers[target]=v;
        v.setVisibility(View.INVISIBLE);
        v.setAlpha(0);
        v.getSettings().setJavaScriptEnabled(true);
        v.getSettings().setDomStorageEnabled(true);
        v.getSettings().setAllowFileAccess(false);
        v.getSettings().setAllowContentAccess(false);
        v.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
        v.getSettings().setSupportMultipleWindows(false);
        v.getSettings().setMediaPlaybackRequiresUserGesture(true);
        v.setWebChromeClient(new WebChromeClient(){
            @Override public void onPermissionRequest(PermissionRequest request){request.deny();}
        });
        v.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(
                        WebView view, WebResourceRequest req){
                Uri uri=req.getUrl();
                String file=trustedFile(target,uri);
                if(file==null) return blocked();
                try{
                    InputStream input=getAssets().open("www/"+file);
                    return new WebResourceResponse(mime(file), "UTF-8",input);
                }catch(IOException ex){return blocked();}
            }
            @Override public boolean shouldOverrideUrlLoading(
                        WebView view, WebResourceRequest req) {
                return trustedFile(target,req.getUrl())==null;
            }
            @Override public void onPageFinished(WebView view,String url){
                if(readers[target]!=view || !index(target).equals(url)){
                    fail("عنوان غير متوقع؛ رفض تشغيل القارئ");
                    return;
                }
                // Our copy of the user's offline assets will only be inserted
                // locally AFTER compiling this generic host on GitHub.
                if(!checking[target])return;
                poll(target,0,false);
            }
            @Override public void onReceivedError(WebView view,
                         WebResourceRequest req, WebResourceError err) {
                if(req.isForMainFrame()) fail("فشل تحميل الصفحة المحلية");
            }
        });
        stage.addView(v,new FrameLayout.LayoutParams(-1,-1));
    }

    private void poll(int target,int attempt,boolean requested){
        WebView v=readers[target];
        if(!busy || v==null || !checking[target])return;
        if(attempt>=MAX_READER_POLLS) {
            checking[target]=false;
            fail("لم تثبت جاهزية القارئ خلال المهلة — بقي السياق السابق كما هو");
            return;
        }
        String js=target==0 ?
            "(function(){try{if(typeof window.openTilawaIndex!=='function'||typeof window.openPage!=='function')return false;"
            +"if(!window.__p868_tilawa_open){window.__p868_tilawa_open=true;window.openTilawaIndex();window.openPage(1)}"
            +"var r=document.querySelector('.view.active');"
            +"return !!(r&&r.id==='mushafReader')}catch(e){return false}})()" :
            "(function(){try{var c=window.__BASAIR_HIFZ_READER_CORE__;"
            +"if(!c||typeof c.openSession!=='function')return false;"
            +"if(!window.__p868_hifz_open){window.__p868_hifz_open=true;c.openSession('listen',1,1)}"
            +"var v=c.state&&c.state();var r=document.querySelector('.view.active');"
            +"return !!(v&&v.active&&r&&r.id==='mushafReader')}catch(e){return false}})()";
        v.evaluateJavascript(js,result -> {
            if(!busy || readers[target]!=v || !checking[target])return;
            if("true".equals(result)){
                checking[target]=false;
                ready[target]=true;
                confirmAndShow(target,false);
            }else {
                v.postDelayed(()->poll(target,attempt+1,true),POLL_MS);
            }
        });
    }

    private void confirmAndShow(int target,boolean alreadyReady){
        WebView v=readers[target];
        if(v==null) {fail("السياق غير موجود");return;}
        if(!index(target).equals(v.getUrl())) {
            fail("تم رفض سياق بعنوان غير موثوق");return;
        }
        if(alreadyReady){
            // Warm return must prove that the preserved runtime is still active.
            v.evaluateJavascript(
                "(function(){var x=document.querySelector('.view.active');"
                +"return !!(x&&x.id==='mushafReader')}catch(e){return false})()",
                r -> {if("true".equals(r))show(target,true);
                    else fail("القارئ المحفوظ لم يعد جاهزًا؛ رفض العرض");});
        }else show(target,false);
    }

    private void show(int target,boolean isWarm){
        for(int i=0;i<2;i++){
            if(readers[i]==null)continue;
            boolean current=i==target;
            readers[i].setVisibility(current?View.VISIBLE:View.INVISIBLE);
            readers[i].setAlpha(current?1f:0f);
            readers[i].setEnabled(current);
            if(current)readers[i].onResume();
            else readers[i].onPause();
        }
        active=target;
        busy=false;
        long dt=SystemClock.elapsedRealtime()-startedMs;
        if(isWarm)warm++;else cold++;
        String msg=name(target)+" | "+(isWarm?"WARM بلا إعادة تحميل":"COLD أول تهيئة")
            +" | "+dt+" ms | cold="+cold+" warm="+warm;
        events.append(msg).append('\n');
        status.setText("P86.8 مختبر مرئي: "+msg+" — الصوت والتسجيل غير متاحين");
    }

    private void fail(String reason) {
        busy=false;
        checking[0]=false;checking[1]=false;
        status.setText("P86.8 لم ينجح الفحص: "+reason);
        events.append("FAIL ").append(reason).append('\n');
    }

    private void probeStorage() {
        if(storageBusy||readers[0]==null||readers[1]==null||!ready[0]||!ready[1]) {
            status.setText("افتح القارئين بنجاح أولًا لفحص فصل التخزين");
            return;
        }
        storageBusy=true;
        String js0="(function(){localStorage.setItem('p868.storage.test','T');return localStorage.getItem('p868.storage.test')})()";
        String js1="(function(){localStorage.setItem('p868.storage.test','H');return localStorage.getItem('p868.storage.test')})()";
        readers[0].evaluateJavascript(js0,a ->
            readers[1].evaluateJavascript(js1,b ->
                readers[0].evaluateJavascript("localStorage.getItem('p868.storage.test')",a2 ->{
                    boolean pass="\"T\"".equals(a) && "\"H\"".equals(b) && "\"T\"".equals(a2);
                    String report="localStorage "+(pass?"PASS":"FAIL")+" T="+a2+" H="+b;
                    events.append(report).append('\n');
                    status.setText(report+" — IndexedDB والترحيل غير مختبرين");
                    storageBusy=false;
                })));
    }

    private static String trustedFile(int slot,Uri uri){
        if(uri==null||!"https".equalsIgnoreCase(uri.getScheme()))return null;
        if(!HOSTS[slot].equalsIgnoreCase(uri.getHost()))return null;
        if(uri.getPort()!=-1||uri.getUserInfo()!=null)return null;
        String p=uri.getPath();
        if(p==null||!p.startsWith("/")||p.contains("\\")||p.indexOf('\0')>=0)return null;
        if(p.length()==1)return "index.html";
        p=p.substring(1);
        for(String seg:p.split("/")){
            if(seg.isEmpty()||seg.equals(".")||seg.equals(".."))return null;
        }
        return p;
    }

    private static String mime(String s){
        String p=s.toLowerCase(Locale.ROOT);
        if(p.endsWith(".html"))return "text/html";
        if(p.endsWith(".js")||p.endsWith(".mjs"))return "text/javascript";
        if(p.endsWith(".css"))return "text/css";
        if(p.endsWith(".json"))return "application/json";
        if(p.endsWith(".png"))return "image/png";
        if(p.endsWith(".webp"))return "image/webp";
        if(p.endsWith(".jpg")||p.endsWith(".jpeg"))return "image/jpeg";
        if(p.endsWith(".svg"))return "image/svg+xml";
        if(p.endsWith(".woff2"))return "font/woff2";
        if(p.endsWith(".woff"))return "font/woff";
        if(p.endsWith(".ttf"))return "font/ttf";
        if(p.endsWith(".otf"))return "font/otf";
        if(p.endsWith(".mp3"))return "audio/mpeg";
        if(p.endsWith(".mp4"))return "video/mp4";
        return "application/octet-stream";
    }
    private static WebResourceResponse blocked(){
        return new WebResourceResponse("text/plain","UTF-8",
            new ByteArrayInputStream(new byte[0]));
    }

    @Override public void onBackPressed(){
        if(active==1){request(0);return;}
        super.onBackPressed();
    }
    @Override protected void onDestroy(){
        for(int i=0;i<2;i++)if(readers[i]!=null){
            readers[i].stopLoading();stage.removeView(readers[i]);
            readers[i].destroy();readers[i]=null;
        }
        super.onDestroy();
    }
}
