// P109 / QA-044 REFERENCE IMPLEMENTATION ONLY — NOT BUILT INTO V690.
// Add to the *original, owner-signed V690 Android project*, if a native update
// becomes authorized. Never compile this standalone file into an unrelated APK.
package app.basair.qurv2;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.webkit.JavascriptInterface;
import java.lang.ref.WeakReference;

public final class BasairExternalBrowserBridge {
    private static final String ALLOWED_URL = "https://way2quran.com/ar/reciters";
    private final WeakReference<Activity> activityRef;

    public BasairExternalBrowserBridge(Activity activity) {
        activityRef = new WeakReference<>(activity);
    }

    @JavascriptInterface
    public void openExternalUrl(final String requestedUrl) {
        // Strict allowlist; do not expose a general purpose URL launcher.
        if (!ALLOWED_URL.equals(requestedUrl)) return;
        final Activity activity = activityRef.get();
        if (activity == null || activity.isFinishing() || activity.isDestroyed()) return;
        activity.runOnUiThread(new Runnable() {
            @Override public void run() {
                if (activity.isFinishing() || activity.isDestroyed()) return;
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(ALLOWED_URL));
                intent.addCategory(Intent.CATEGORY_BROWSABLE);
                // IMPORTANT: No WebView.loadUrl(); no WebView navigation.
                // The operating system opens the default browser (or shows a chooser).
                try {
                    activity.startActivity(intent);
                } catch (ActivityNotFoundException | SecurityException e) {
                    // Native logging/UX only; leave the current Basair page intact.
                }
            }
        });
    }
}

// Integration in the *trusted, local-only* V690 WebView initialization, BEFORE
// its first page load:
// webView.addJavascriptInterface(
//     new BasairExternalBrowserBridge(activity),
//     "BasairExternalBrowser"
// );
//
// Do not enable this bridge in a WebView that loads arbitrary remote pages.
// Verify Android Back, lifecycle, audio focus, Masad, Sobhi, downloads, and rollback.
// This class does NOT ship via a JS-only OTA. Owner APK signing is still required.
