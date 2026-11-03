package p86.lab;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.graphics.Color;
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
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

/**
 * ONLY A SYNTHETIC P86 LAB. Contains no Quran pages, owner signing, audio
 * bridges, microphone, tafsir data, or code from the protected V655 package.
 * A synthetic suspend acknowledgment is NOT an Android media-release proof.
 */
public final class DualContextLabActivity extends Activity {
    private static final String[] URLS = {
        "https://tilawa.p86.invalid/index.html",
        "https://hifz.p86.invalid/index.html"
    };
    private final WebView[] web = new WebView[2];
    private final boolean[] ready = new boolean[2];
    private FrameLayout frame;
    private TextView status;
    private int active = -1;
    private boolean switching;
    private long transitionStarted;
    private int coldCount;
    private int warmCount;
    private final StringBuilder metrics = new StringBuilder();

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.WHITE);
        LinearLayout controls = new LinearLayout(this);
        Button tilawa = new Button(this); tilawa.setText("تلاوة تجريبية");
        Button hifz = new Button(this); hifz.setText("حفظ تجريبي");
        controls.addView(tilawa, new LinearLayout.LayoutParams(0, -2, 1));
        controls.addView(hifz, new LinearLayout.LayoutParams(0, -2, 1));
        LinearLayout tools = new LinearLayout(this);
        Button probe = new Button(this); probe.setText("فحص التخزين");
        Button copy = new Button(this); copy.setText("نسخ القياسات");
        tools.addView(probe, new LinearLayout.LayoutParams(0, -2, 1));
        tools.addView(copy, new LinearLayout.LayoutParams(0, -2, 1));
        status = new TextView(this);
        status.setTextSize(15);
        status.setPadding(12, 12, 12, 12);
        status.setText("P86 synthetic lab. Not Basair Quran. No real audio.");
        frame = new FrameLayout(this);
        root.addView(controls);
        root.addView(tools);
        root.addView(status);
        root.addView(frame, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
        setContentView(root);
        tilawa.setOnClickListener(v -> switchTo(0));
        hifz.setOnClickListener(v -> switchTo(1));
        probe.setOnClickListener(v -> testStorageIsolation());
        copy.setOnClickListener(v -> {
            ClipboardManager clipboard = (ClipboardManager)
                getSystemService(Context.CLIPBOARD_SERVICE);
            if (clipboard != null) {
                clipboard.setPrimaryClip(ClipData.newPlainText(
                    "P86 synthetic timings", metrics.toString()));
                status.setText("Copied synthetic timings only. No Quran content.");
            }
        });
        switchTo(0);
    }

    private void switchTo(int target) {
        if (switching) {
            status.setText("Switch already in progress; request ignored safely.");
            return;
        }
        if (target == active && ready[target]) {
            status.setText("Already visible: " + label(target));
            return;
        }
        switching = true;
        transitionStarted = SystemClock.elapsedRealtime();
        final int previous = active;
        if (previous >= 0 && web[previous] != null) {
            // This synthetic page has no audio or microphone. In V655,
            // do not proceed without proof from every native audio bridge.
            web[previous].evaluateJavascript(
                "Boolean(window.P86_SYNTHETIC && P86_SYNTHETIC.suspend())",
                result -> {
                    if (!"true".equals(result)) {
                        switching = false;
                        status.setText("SAFE STOP: no synthetic suspend ACK");
                        return;
                    }
                    activate(target, previous);
                });
        } else {
            activate(target, previous);
        }
    }

    private void activate(int target, int previous) {
        if (previous >= 0 && web[previous] != null) {
            web[previous].setVisibility(View.INVISIBLE);
            web[previous].onPause();
        }
        active = target;
        if (web[target] == null) {
            createWebView(target);
            web[target].setVisibility(View.VISIBLE);
            web[target].loadUrl(URLS[target]); // ONLY first load.
        } else {
            // The same actual WebView is reused. No location.reload().
            web[target].setVisibility(View.VISIBLE);
            web[target].onResume();
            if (ready[target]) completeSwitch(target, true);
        }
    }

    private void createWebView(final int id) {
        WebView view = new WebView(this);
        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        view.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(PermissionRequest request) {
                request.deny();
            }
        });
        view.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(
                    WebView v, WebResourceRequest request) {
                if (URLS[id].equals(request.getUrl().toString())) {
                    byte[] html = syntheticPage(id).getBytes(StandardCharsets.UTF_8);
                    return new WebResourceResponse("text/html", "UTF-8",
                        new ByteArrayInputStream(html));
                }
                // No fallback to network for unrecognized resources.
                return new WebResourceResponse("text/plain", "UTF-8",
                    new ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(
                    WebView v, WebResourceRequest request) {
                return !URLS[id].equals(request.getUrl().toString());
            }
            @Override public void onPageFinished(WebView v, String url) {
                if (!URLS[id].equals(url)) {
                    switching = false;
                    status.setText("SAFE STOP: unexpected main-frame URL");
                    return;
                }
                v.evaluateJavascript(
                    "Boolean(window.P86_SYNTHETIC && P86_SYNTHETIC.ready)",
                    value -> {
                        if (v != web[id] || active != id) return;
                        if (!"true".equals(value)) {
                            switching = false;
                            status.setText("SAFE STOP: synthetic page not ready");
                            return;
                        }
                        ready[id] = true;
                        v.onResume();
                        completeSwitch(id, false);
                    });
            }
            @Override public void onReceivedError(
                    WebView v, WebResourceRequest req, WebResourceError error) {
                if (req.isForMainFrame()) {
                    switching = false;
                    status.setText("SAFE STOP: main-frame WebView load failure");
                }
            }
        });
        view.setVisibility(View.INVISIBLE);
        web[id] = view;
        frame.addView(view, new FrameLayout.LayoutParams(-1, -1));
    }

    private void completeSwitch(int target, boolean warm) {
        switching = false;
        long duration = SystemClock.elapsedRealtime() - transitionStarted;
        if (warm) warmCount++; else coldCount++;
        metrics.append(label(target)).append(',')
            .append(warm ? "warm" : "cold").append(',')
            .append(duration).append("ms\n");
        status.setText("P86 synthetic " + label(target) + " / "
            + (warm ? "WARM reuse" : "COLD first load") + " / "
            + duration + " ms / cold=" + coldCount + " / warm=" + warmCount
            + " — NOT a Basair performance claim");
    }

    private void testStorageIsolation() {
        if (!ready[0] || !ready[1]) {
            status.setText("Open both synthetic pages once before testing storage");
            return;
        }
        String query = "localStorage.getItem('p86.lab.identity')";
        web[0].evaluateJavascript(query, left ->
            web[1].evaluateJavascript(query, right -> {
                boolean isolated = "\"tilawa\"".equals(left)
                    && "\"hifz\"".equals(right);
                status.setText("localStorage origin isolation: "
                    + (isolated ? "PASS" : "FAIL")
                    + " / T=" + left + " / H=" + right
                    + " — IndexedDB and real V655 remain untested");
            }));
    }

    private static String label(int id) { return id == 0 ? "tilawa" : "hifz"; }

    private static String syntheticPage(int id) {
        String name = label(id);
        return "<!doctype html><html lang='ar' dir='rtl'><head>"
            + "<meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
            + "</head><body style='font:20px sans-serif;padding:20px;background:#f2f4ee'>"
            + "<h2>مختبر P86 — " + name + "</h2>"
            + "<p>صفحة اصطناعية فقط؛ ليست مصحف بصائر القرآن.</p>"
            + "<p id='counter'></p>"
            + "<button onclick='inc()'>زيادة عداد السياق</button>"
            + "<script>(function(){'use strict';"
            + "var n='" + name + "';"
            + "if(!localStorage.getItem('p86.lab.identity'))"
            + "localStorage.setItem('p86.lab.identity',n);"
            + "function draw(){document.getElementById('counter').textContent="
            + "'العداد: '+(localStorage.getItem('p86.lab.count')||'0');}"
            + "window.inc=function(){localStorage.setItem('p86.lab.count',"
            + "String((Number(localStorage.getItem('p86.lab.count'))||0)+1));draw()};"
            + "window.P86_SYNTHETIC={ready:true,suspend:function(){return true}};"
            + "draw();})();</script></body></html>";
    }

    @Override public void onBackPressed() {
        if (active == 1) switchTo(0);
        else super.onBackPressed();
    }
    @Override protected void onDestroy() {
        for (int i = 0; i < web.length; i++) {
            if (web[i] != null) {
                web[i].stopLoading();
                web[i].destroy();
                web[i] = null;
            }
        }
        super.onDestroy();
    }
}
