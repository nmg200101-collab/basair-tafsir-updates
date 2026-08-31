package app.basair.quran;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import java.util.ArrayList;
import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final int REQ_AUDIO = 7301;
    private WebView webView;
    private SpeechRecognizer speechRecognizer;
    private String pendingLanguage = "ar-SA";
    private boolean pendingStart = false;
    private boolean speechRunning = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        if (Build.VERSION.SDK_INT >= 17) s.setMediaPlaybackRequiresUserGesture(false);
        webView.setWebChromeClient(new MicChromeClient());
        webView.addJavascriptInterface(new NativeSpeechBridge(), "BasairSpeech");
        if (Build.VERSION.SDK_INT >= 23 && checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_AUDIO);
        }
        webView.loadUrl("file:///android_asset/www/index.html");
    }

    private void ensureRecognizer() {
        if (speechRecognizer != null) return;
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            emit("error", "service-not-available");
            return;
        }
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
        speechRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) { speechRunning = true; emit("start", ""); }
            @Override public void onBeginningOfSpeech() { emit("speech", "begin"); }
            @Override public void onRmsChanged(float rmsdB) { emit("rms", String.valueOf(rmsdB)); }
            @Override public void onBufferReceived(byte[] buffer) { }
            @Override public void onEndOfSpeech() { emit("speech", "end"); }
            @Override public void onError(int error) {
                speechRunning = false;
                emit("error", errorName(error));
                emit("end", "");
            }
            @Override public void onResults(Bundle results) {
                ArrayList<String> list = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (list != null && !list.isEmpty()) emit("final", list.get(0));
                speechRunning = false;
                emit("end", "");
            }
            @Override public void onPartialResults(Bundle partialResults) {
                ArrayList<String> list = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (list != null && !list.isEmpty()) emit("partial", list.get(0));
            }
            @Override public void onEvent(int eventType, Bundle params) { }
        });
    }

    private void startNativeSpeech(final String lang) {
        pendingLanguage = (lang == null || lang.trim().isEmpty()) ? "ar-SA" : lang;
        if (Build.VERSION.SDK_INT >= 23 && checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            pendingStart = true;
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_AUDIO);
            emit("permission", "required");
            return;
        }
        pendingStart = false;
        ensureRecognizer();
        if (speechRecognizer == null) return;
        try {
            if (speechRunning) {
                speechRecognizer.cancel();
                speechRunning = false;
            }
            Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, pendingLanguage);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, pendingLanguage);
            i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
            i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 20);
            i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getPackageName());
            speechRecognizer.startListening(i);
            emit("opening", pendingLanguage);
        } catch (Throwable t) {
            speechRunning = false;
            emit("error", "start-failed:" + t.getClass().getSimpleName());
            emit("end", "");
        }
    }

    private void emit(final String type, final String value) {
        if (webView == null) return;
        final String js = "window.__BASAIR_NATIVE_SPEECH_EVENT__&&window.__BASAIR_NATIVE_SPEECH_EVENT__(" + JSONObject.quote(type) + "," + JSONObject.quote(value == null ? "" : value) + ")";
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override public void run() {
                if (Build.VERSION.SDK_INT >= 19) webView.evaluateJavascript(js, null);
                else webView.loadUrl("javascript:" + js);
            }
        });
    }

    private String errorName(int e) {
        switch (e) {
            case 1: return "network-timeout";
            case 2: return "network";
            case 3: return "audio-capture";
            case 4: return "server";
            case 5: return "client";
            case 6: return "no-speech";
            case 7: return "no-match";
            case 8: return "recognizer-busy";
            case 9: return "not-allowed";
            case 10: return "too-many-requests";
            case 11: return "server-disconnected";
            case 12: return "language-not-supported";
            case 13: return "language-unavailable";
            default: return "error-" + e;
        }
    }

    public final class NativeSpeechBridge {
        @JavascriptInterface public boolean isAvailable() {
            try { return SpeechRecognizer.isRecognitionAvailable(MainActivity.this); }
            catch (Throwable t) { return false; }
        }
        @JavascriptInterface public boolean hasPermission() {
            return Build.VERSION.SDK_INT < 23 || checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
        }
        @JavascriptInterface public void start(final String lang) {
            runOnUiThread(new Runnable() { @Override public void run() { startNativeSpeech(lang); } });
        }
        @JavascriptInterface public void stop() {
            runOnUiThread(new Runnable() { @Override public void run() { if (speechRecognizer != null) speechRecognizer.stopListening(); } });
        }
        @JavascriptInterface public void cancel() {
            runOnUiThread(new Runnable() { @Override public void run() { if (speechRecognizer != null) speechRecognizer.cancel(); speechRunning = false; emit("end", ""); } });
        }
        @JavascriptInterface public boolean isListening() { return speechRunning; }
    }

    public final class MicChromeClient extends WebChromeClient {
        @Override public void onPermissionRequest(final PermissionRequest request) {
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    try { request.grant(request.getResources()); }
                    catch (Throwable t) { request.deny(); }
                }
            });
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_AUDIO) {
            boolean ok = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            emit("permission", ok ? "granted" : "denied");
            if (ok && pendingStart) startNativeSpeech(pendingLanguage);
            else pendingStart = false;
        }
    }

    @Override public void onBackPressed() {
        if (webView != null) webView.loadUrl("javascript:window.basairBack&&window.basairBack()");
        else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if (speechRecognizer != null) {
            try { speechRecognizer.destroy(); } catch (Throwable ignored) { }
            speechRecognizer = null;
        }
        if (webView != null) {
            webView.removeJavascriptInterface("BasairSpeech");
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
