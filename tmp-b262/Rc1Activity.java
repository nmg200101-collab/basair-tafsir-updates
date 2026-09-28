package app.basair.quran;

import android.content.ClipData;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import java.io.OutputStream;

/**
 * API 35/36 compatibility shell.
 * Core Basair behavior remains in MainActivity.
 * B262 adds a narrow native bridge for real exported files.
 */
public final class Rc1Activity extends MainActivity {
    private boolean appBridgeInstalled = false;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        installSafeAppBridge();
        final View bridgeRoot = findViewById(android.R.id.content);
        if (bridgeRoot != null) {
            bridgeRoot.postDelayed(new Runnable() {
                @Override public void run() { installSafeAppBridge(); }
            }, 120);
            bridgeRoot.postDelayed(new Runnable() {
                @Override public void run() { installSafeAppBridge(); }
            }, 650);
        }
        if (Build.VERSION.SDK_INT >= 35) {
            final View content = findViewById(android.R.id.content);
            if (content != null) {
                content.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
                    @Override
                    public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                        if (Build.VERSION.SDK_INT >= 30) {
                            Insets bars = insets.getInsets(
                                WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                        } else {
                            v.setPadding(
                                insets.getSystemWindowInsetLeft(),
                                insets.getSystemWindowInsetTop(),
                                insets.getSystemWindowInsetRight(),
                                insets.getSystemWindowInsetBottom());
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

    private String safeFileName(String name) {
        String n = name == null ? "Basair-export.pdf" : name.trim();
        if (n.isEmpty()) n = "Basair-export.pdf";
        n = n.replaceAll("[\\\\/:*?\"<>|]+", "-");
        if (n.length() > 120) n = n.substring(0, 120);
        return n;
    }

    private String safeMime(String mime) {
        String m = mime == null ? "" : mime.trim();
        return m.isEmpty() ? "application/octet-stream" : m;
    }

    private final class AppBridge {
        @JavascriptInterface
        public void shareText(final String text, final String title) {
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

        /**
         * Writes a Base64 payload as a real user-visible file under
         * Downloads/Basair Quran on Android 10+ and returns its content URI.
         * Return values beginning with ERR: indicate failure.
         */
        @JavascriptInterface
        public String saveBase64File(final String base64, final String fileName, final String mime) {
            if (Build.VERSION.SDK_INT < 29) {
                return "ERR:ANDROID_VERSION";
            }
            if (base64 == null || base64.trim().isEmpty()) {
                return "ERR:EMPTY_DATA";
            }
            try {
                byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
                ContentResolver resolver = Rc1Activity.this.getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, safeFileName(fileName));
                values.put(MediaStore.MediaColumns.MIME_TYPE, safeMime(mime));
                values.put(MediaStore.MediaColumns.RELATIVE_PATH,
                    Environment.DIRECTORY_DOWNLOADS + "/Basair Quran");
                values.put(MediaStore.MediaColumns.IS_PENDING, 1);

                Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) return "ERR:INSERT";

                OutputStream out = null;
                try {
                    out = resolver.openOutputStream(uri, "w");
                    if (out == null) {
                        resolver.delete(uri, null, null);
                        return "ERR:OUTPUT";
                    }
                    out.write(bytes);
                    out.flush();
                } finally {
                    if (out != null) try { out.close(); } catch (Exception ignored) {}
                }

                ContentValues done = new ContentValues();
                done.put(MediaStore.MediaColumns.IS_PENDING, 0);
                resolver.update(uri, done, null, null);
                return uri.toString();
            } catch (Throwable t) {
                return "ERR:" + t.getClass().getSimpleName();
            }
        }

        @JavascriptInterface
        public boolean openFile(final String uriText, final String mime) {
            if (uriText == null || uriText.trim().isEmpty()) return false;
            final Uri uri;
            try { uri = Uri.parse(uriText); } catch (Throwable t) { return false; }
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    try {
                        Intent view = new Intent(Intent.ACTION_VIEW);
                        view.setDataAndType(uri, safeMime(mime));
                        view.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        Rc1Activity.this.startActivity(Intent.createChooser(view, "فتح الملف"));
                    } catch (Throwable ignored) {}
                }
            });
            return true;
        }

        @JavascriptInterface
        public boolean shareFile(final String uriText, final String mime, final String title) {
            if (uriText == null || uriText.trim().isEmpty()) return false;
            final Uri uri;
            try { uri = Uri.parse(uriText); } catch (Throwable t) { return false; }
            final String safeTitle = (title == null || title.trim().isEmpty()) ? "بصائر القرآن" : title;
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    try {
                        Intent send = new Intent(Intent.ACTION_SEND);
                        send.setType(safeMime(mime));
                        send.putExtra(Intent.EXTRA_STREAM, uri);
                        send.setClipData(ClipData.newRawUri("Basair export", uri));
                        send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        Rc1Activity.this.startActivity(Intent.createChooser(send, safeTitle));
                    } catch (Throwable ignored) {}
                }
            });
            return true;
        }

        @JavascriptInterface
        public void finishApp() {
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    Rc1Activity.this.finish();
                }
            });
        }
    }
}
