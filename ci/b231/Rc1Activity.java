package app.basair.quran;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.graphics.Insets;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

public final class Rc1Activity extends MainActivity {
    private boolean appBridgeInstalled = false;
    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        installSafeAppBridge();
        final View bridgeRoot = findViewById(android.R.id.content);
        if (bridgeRoot != null) {
            bridgeRoot.postDelayed(new Runnable() { @Override public void run() { installSafeAppBridge(); } }, 120);
            bridgeRoot.postDelayed(new Runnable() { @Override public void run() { installSafeAppBridge(); } }, 650);
        }
        if (Build.VERSION.SDK_INT >= 35) {
            final View content = findViewById(android.R.id.content);
            if (content != null) {
                content.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
                    @Override public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                        if (Build.VERSION.SDK_INT >= 30) {
                            Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                        } else {
                            v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
                        }
                        return insets;
                    }
                });
                content.requestApplyInsets();
            }
        }
    }
    private void installSafeAppBridge() {
        if (appBridgeInstalled) return;
        final View root = findViewById(android.R.id.content);
        final WebView webView = findWebView(root);
        if (webView != null) {
            webView.addJavascriptInterface(new AppBridge(), "BasairApp");
            appBridgeInstalled = true;
        }
    }
    private WebView findWebView(View view) {
        if (view instanceof WebView) return (WebView) view;
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0; i < group.getChildCount(); i++) {
                WebView found = findWebView(group.getChildAt(i));
                if (found != null) return found;
            }
        }
        return null;
    }
    private final class AppBridge {
        @JavascriptInterface public void shareText(final String text, final String title) {
            final String safeText = text == null ? "" : text;
            final String safeTitle = (title == null || title.trim().isEmpty()) ? "بصائر القرآن" : title;
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    Intent send = new Intent(Intent.ACTION_SEND);
                    send.setType("text/plain");
                    send.putExtra(Intent.EXTRA_TEXT, safeText);
                    Rc1Activity.this.startActivity(Intent.createChooser(send, safeTitle));
                }
            });
        }
        @JavascriptInterface public void finishApp() {
            runOnUiThread(new Runnable() { @Override public void run() { Rc1Activity.this.finish(); } });
        }
    }
}
