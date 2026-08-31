package app.basair.quran;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.MediaPlayer;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelFileDescriptor;
import android.provider.MediaStore;
import android.content.ContentValues;
import android.database.Cursor;
import android.speech.RecognitionListener;
import android.speech.RecognitionService;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final String TAG = "BASAIR_SPEECH";
    private static final int REQ_AUDIO = 7301;

    private WebView webView;
    private final Handler main = new Handler(Looper.getMainLooper());

    private SpeechRecognizer recognizer;
    private boolean speechWanted = false;
    private boolean speechSessionActive = false;
    private boolean speechReady = false;
    private boolean pendingSpeechStart = false;
    private String speechLanguage = "ar-SA";
    private int restartGeneration = 0;
    private int busyErrors = 0;
    private String lastSpeechError = "";

    private MediaRecorder recorder;
    private ParcelFileDescriptor recordPfd;
    private Uri recordUri;
    private boolean recording = false;
    private boolean resumeSpeechAfterRecording = false;
    private MediaPlayer voicePlayer;

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
        s.setAllowContentAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        if (Build.VERSION.SDK_INT >= 17) s.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebChromeClient(new MicChromeClient());
        webView.addJavascriptInterface(new NativeSpeechBridge(), "BasairSpeech");
        webView.addJavascriptInterface(new NativeVoiceBridge(), "BasairVoice");

        if (!hasAudioPermission()) {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_AUDIO);
        }
        webView.loadUrl("file:///android_asset/www/index.html");
    }

    private boolean hasAudioPermission() {
        return Build.VERSION.SDK_INT < 23 || checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    private int recognitionServiceCount() {
        try {
            Intent q = new Intent(RecognitionService.SERVICE_INTERFACE);
            List<?> list = getPackageManager().queryIntentServices(q, 0);
            return list == null ? 0 : list.size();
        } catch (Throwable t) {
            return -1;
        }
    }

    private boolean recognitionAvailable() {
        try { return SpeechRecognizer.isRecognitionAvailable(this); }
        catch (Throwable t) { return false; }
    }

    private void destroyRecognizer() {
        restartGeneration++;
        speechSessionActive = false;
        speechReady = false;
        if (recognizer != null) {
            try { recognizer.cancel(); } catch (Throwable ignored) {}
            try { recognizer.destroy(); } catch (Throwable ignored) {}
            recognizer = null;
        }
    }

    private void ensureRecognizer() {
        if (recognizer != null) return;
        if (!recognitionAvailable()) {
            lastSpeechError = "service-unavailable";
            emitSpeech("fatal", lastSpeechError);
            return;
        }
        recognizer = SpeechRecognizer.createSpeechRecognizer(this);
        recognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) {
                speechSessionActive = true;
                speechReady = true;
                busyErrors = 0;
                emitSpeech("ready", speechLanguage);
            }
            @Override public void onBeginningOfSpeech() { emitSpeech("speech-begin", ""); }
            @Override public void onRmsChanged(float rmsdB) { emitSpeech("rms", String.format(Locale.US, "%.2f", rmsdB)); }
            @Override public void onBufferReceived(byte[] buffer) { }
            @Override public void onEndOfSpeech() { emitSpeech("speech-end", ""); }
            @Override public void onError(int error) { handleSpeechError(error); }
            @Override public void onResults(Bundle results) {
                ArrayList<String> list = results == null ? null : results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (list != null && !list.isEmpty()) emitSpeech("final", list.get(0));
                speechSessionActive = false;
                speechReady = false;
                if (speechWanted) scheduleSpeechRestart(140, "results");
                else emitSpeech("stopped", "results");
            }
            @Override public void onPartialResults(Bundle partialResults) {
                ArrayList<String> list = partialResults == null ? null : partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (list != null && !list.isEmpty()) emitSpeech("partial", list.get(0));
            }
            @Override public void onEvent(int eventType, Bundle params) { }
        });
    }

    private void handleSpeechError(int error) {
        speechSessionActive = false;
        speechReady = false;
        String code = errorName(error);
        lastSpeechError = code;
        Log.w(TAG, "speech error=" + error + " " + code + " wanted=" + speechWanted);

        if (!speechWanted) {
            emitSpeech("stopped", code);
            return;
        }

        boolean recoverable = error == SpeechRecognizer.ERROR_NO_MATCH
                || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT
                || error == SpeechRecognizer.ERROR_NETWORK
                || error == SpeechRecognizer.ERROR_NETWORK_TIMEOUT
                || error == SpeechRecognizer.ERROR_SERVER
                || error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY
                || error == SpeechRecognizer.ERROR_CLIENT;

        if (recoverable) {
            emitSpeech("recoverable", code);
            long delay = 220;
            if (error == SpeechRecognizer.ERROR_NETWORK || error == SpeechRecognizer.ERROR_NETWORK_TIMEOUT) delay = 700;
            if (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY || error == SpeechRecognizer.ERROR_CLIENT) {
                busyErrors++;
                if (busyErrors >= 2) {
                    try { if (recognizer != null) recognizer.destroy(); } catch (Throwable ignored) {}
                    recognizer = null;
                    busyErrors = 0;
                    delay = 420;
                } else delay = 320;
            }
            scheduleSpeechRestart(delay, code);
            return;
        }

        speechWanted = false;
        emitSpeech("fatal", code);
    }

    private void scheduleSpeechRestart(long delay, final String reason) {
        final int gen = ++restartGeneration;
        emitSpeech("restarting", reason == null ? "" : reason);
        main.postDelayed(new Runnable() {
            @Override public void run() {
                if (gen != restartGeneration || !speechWanted || recording) return;
                beginSpeechSession();
            }
        }, delay);
    }

    private Intent speechIntent() {
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, speechLanguage);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, speechLanguage);
        i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 10);
        i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getPackageName());
        return i;
    }

    private void beginSpeechSession() {
        if (!speechWanted || recording) return;
        if (!hasAudioPermission()) {
            pendingSpeechStart = true;
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_AUDIO);
            emitSpeech("permission-required", "");
            return;
        }
        pendingSpeechStart = false;
        ensureRecognizer();
        if (recognizer == null) return;
        if (speechSessionActive) return;
        try {
            speechSessionActive = true;
            speechReady = false;
            recognizer.startListening(speechIntent());
            emitSpeech("opening", speechLanguage);
        } catch (Throwable t) {
            speechSessionActive = false;
            speechReady = false;
            lastSpeechError = "start-exception:" + t.getClass().getSimpleName();
            emitSpeech("recoverable", lastSpeechError);
            try { recognizer.destroy(); } catch (Throwable ignored) {}
            recognizer = null;
            if (speechWanted) scheduleSpeechRestart(450, lastSpeechError);
        }
    }

    private void startSpeech(String lang) {
        if (lang != null && !lang.trim().isEmpty()) speechLanguage = lang.trim();
        if (recording) {
            emitSpeech("fatal", "recorder-owns-microphone");
            return;
        }
        speechWanted = true;
        restartGeneration++;
        beginSpeechSession();
    }

    private void stopSpeech(boolean cancel) {
        speechWanted = false;
        pendingSpeechStart = false;
        restartGeneration++;
        speechReady = false;
        if (recognizer != null) {
            try {
                if (cancel) recognizer.cancel();
                else recognizer.stopListening();
            } catch (Throwable ignored) {}
        }
        speechSessionActive = false;
        emitSpeech("stopped", cancel ? "cancel" : "stop");
    }

    private String errorName(int e) {
        switch (e) {
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "network-timeout";
            case SpeechRecognizer.ERROR_NETWORK: return "network";
            case SpeechRecognizer.ERROR_AUDIO: return "audio-capture";
            case SpeechRecognizer.ERROR_SERVER: return "server";
            case SpeechRecognizer.ERROR_CLIENT: return "client";
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "no-speech";
            case SpeechRecognizer.ERROR_NO_MATCH: return "no-match";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: return "recognizer-busy";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "not-allowed";
            default: return "error-" + e;
        }
    }

    private void emitSpeech(final String type, final String value) {
        if (webView == null) return;
        final String js = "window.__BASAIR_NATIVE_SPEECH_EVENT__&&window.__BASAIR_NATIVE_SPEECH_EVENT__("
                + JSONObject.quote(type) + "," + JSONObject.quote(value == null ? "" : value) + ")";
        main.post(new Runnable() {
            @Override public void run() {
                try {
                    if (Build.VERSION.SDK_INT >= 19) webView.evaluateJavascript(js, null);
                    else webView.loadUrl("javascript:" + js);
                } catch (Throwable t) { Log.e(TAG, "emit failed", t); }
            }
        });
    }

    private void releaseRecorder() {
        if (recorder != null) {
            try { recorder.reset(); } catch (Throwable ignored) {}
            try { recorder.release(); } catch (Throwable ignored) {}
            recorder = null;
        }
        if (recordPfd != null) {
            try { recordPfd.close(); } catch (Throwable ignored) {}
            recordPfd = null;
        }
        recording = false;
    }

    private Uri createRecordingUri() throws Exception {
        String name = "Basair-Hifz-" + System.currentTimeMillis() + ".m4a";
        if (Build.VERSION.SDK_INT >= 29) {
            ContentValues cv = new ContentValues();
            cv.put(MediaStore.Audio.Media.DISPLAY_NAME, name);
            cv.put(MediaStore.Audio.Media.MIME_TYPE, "audio/mp4");
            cv.put(MediaStore.Audio.Media.RELATIVE_PATH, Environment.DIRECTORY_MUSIC + "/Basair Quran");
            cv.put(MediaStore.Audio.Media.IS_PENDING, 1);
            Uri uri = getContentResolver().insert(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, cv);
            if (uri == null) throw new Exception("media-store-insert");
            return uri;
        }
        File dir = getExternalFilesDir(Environment.DIRECTORY_MUSIC);
        if (dir == null) dir = getFilesDir();
        if (!dir.exists()) dir.mkdirs();
        return Uri.fromFile(new File(dir, name));
    }

    private void startVoiceRecording() {
        if (recording) return;
        if (!hasAudioPermission()) {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_AUDIO);
            emitVoice("error", "permission-required");
            return;
        }
        resumeSpeechAfterRecording = speechWanted;
        stopSpeech(true);
        main.postDelayed(new Runnable() {
            @Override public void run() {
                try {
                    recordUri = createRecordingUri();
                    recorder = new MediaRecorder();
                    recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
                    recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
                    recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
                    recorder.setAudioEncodingBitRate(128000);
                    recorder.setAudioSamplingRate(44100);
                    if ("file".equals(recordUri.getScheme())) {
                        recorder.setOutputFile(recordUri.getPath());
                    } else {
                        recordPfd = getContentResolver().openFileDescriptor(recordUri, "w");
                        if (recordPfd == null) throw new Exception("open-output");
                        recorder.setOutputFile(recordPfd.getFileDescriptor());
                    }
                    recorder.prepare();
                    recorder.start();
                    recording = true;
                    emitVoice("start", recordUri.toString());
                } catch (Throwable t) {
                    Log.e(TAG, "record start", t);
                    releaseRecorder();
                    if (recordUri != null && "content".equals(recordUri.getScheme())) {
                        try { getContentResolver().delete(recordUri, null, null); } catch (Throwable ignored) {}
                    }
                    recordUri = null;
                    emitVoice("error", "start:" + t.getClass().getSimpleName());
                    if (resumeSpeechAfterRecording) {
                        resumeSpeechAfterRecording = false;
                        speechWanted = true;
                        scheduleSpeechRestart(500, "record-failed");
                    }
                }
            }
        }, 420);
    }

    private void stopVoiceRecording() {
        if (!recording || recorder == null) {
            emitVoice("error", "not-recording");
            return;
        }
        boolean ok = true;
        try { recorder.stop(); } catch (Throwable t) { ok = false; Log.w(TAG, "record stop", t); }
        releaseRecorder();
        if (recordUri != null && Build.VERSION.SDK_INT >= 29 && "content".equals(recordUri.getScheme())) {
            try {
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Audio.Media.IS_PENDING, 0);
                getContentResolver().update(recordUri, cv, null, null);
            } catch (Throwable ignored) {}
        }
        final String out = recordUri == null ? "" : recordUri.toString();
        emitVoice(ok ? "saved" : "error", ok ? out : "stop-failed");
        if (!ok && recordUri != null) {
            try { getContentResolver().delete(recordUri, null, null); } catch (Throwable ignored) {}
        }
        if (resumeSpeechAfterRecording) {
            resumeSpeechAfterRecording = false;
            speechWanted = true;
            scheduleSpeechRestart(520, "after-recording");
        }
    }

    private void emitVoice(final String type, final String value) {
        if (webView == null) return;
        final String js = "window.__BASAIR_NATIVE_VOICE_EVENT__&&window.__BASAIR_NATIVE_VOICE_EVENT__("
                + JSONObject.quote(type) + "," + JSONObject.quote(value == null ? "" : value) + ")";
        main.post(new Runnable() {
            @Override public void run() {
                if (Build.VERSION.SDK_INT >= 19) webView.evaluateJavascript(js, null);
                else webView.loadUrl("javascript:" + js);
            }
        });
    }

    private String listRecordingsJson() {
        JSONArray arr = new JSONArray();
        if (Build.VERSION.SDK_INT < 29) return arr.toString();
        Cursor c = null;
        try {
            Uri base = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
            String[] proj = { MediaStore.Audio.Media._ID, MediaStore.Audio.Media.DISPLAY_NAME, MediaStore.Audio.Media.DATE_ADDED, MediaStore.Audio.Media.DURATION };
            String sel = MediaStore.Audio.Media.RELATIVE_PATH + "=?";
            String[] args = { Environment.DIRECTORY_MUSIC + "/Basair Quran/" };
            c = getContentResolver().query(base, proj, sel, args, MediaStore.Audio.Media.DATE_ADDED + " DESC");
            int count = 0;
            while (c != null && c.moveToNext() && count++ < 30) {
                long id = c.getLong(0);
                JSONObject o = new JSONObject();
                o.put("uri", Uri.withAppendedPath(base, String.valueOf(id)).toString());
                o.put("name", c.getString(1));
                o.put("date", c.getLong(2));
                o.put("duration", c.getLong(3));
                arr.put(o);
            }
        } catch (Throwable t) { Log.w(TAG, "list recordings", t); }
        finally { if (c != null) c.close(); }
        return arr.toString();
    }

    private void playRecording(String uri) {
        try {
            if (voicePlayer != null) { try { voicePlayer.release(); } catch (Throwable ignored) {} }
            voicePlayer = new MediaPlayer();
            voicePlayer.setDataSource(this, Uri.parse(uri));
            voicePlayer.setOnPreparedListener(new MediaPlayer.OnPreparedListener() {
                @Override public void onPrepared(MediaPlayer mp) { mp.start(); emitVoice("play", "start"); }
            });
            voicePlayer.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
                @Override public void onCompletion(MediaPlayer mp) { emitVoice("play", "end"); }
            });
            voicePlayer.prepareAsync();
        } catch (Throwable t) { emitVoice("error", "play:" + t.getClass().getSimpleName()); }
    }

    public final class NativeSpeechBridge {
        @JavascriptInterface public boolean isAvailable() { return recognitionAvailable(); }
        @JavascriptInterface public boolean hasPermission() { return hasAudioPermission(); }
        @JavascriptInterface public int serviceCount() { return recognitionServiceCount(); }
        @JavascriptInterface public boolean isListening() { return speechReady; }
        @JavascriptInterface public boolean isWanted() { return speechWanted; }
        @JavascriptInterface public String lastError() { return lastSpeechError; }
        @JavascriptInterface public void start(final String lang) { runOnUiThread(new Runnable() { @Override public void run() { startSpeech(lang); } }); }
        @JavascriptInterface public void stop() { runOnUiThread(new Runnable() { @Override public void run() { stopSpeech(false); } }); }
        @JavascriptInterface public void cancel() { runOnUiThread(new Runnable() { @Override public void run() { stopSpeech(true); } }); }
        @JavascriptInterface public String diagnostics() {
            try {
                JSONObject o = new JSONObject();
                o.put("available", recognitionAvailable());
                o.put("permission", hasAudioPermission());
                o.put("services", recognitionServiceCount());
                o.put("wanted", speechWanted);
                o.put("active", speechSessionActive);
                o.put("ready", speechReady);
                o.put("lastError", lastSpeechError);
                o.put("sdk", Build.VERSION.SDK_INT);
                return o.toString();
            } catch (Throwable t) { return "{}"; }
        }
        @JavascriptInterface public void selfTest() {
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    emitSpeech("opening", "self-test");
                    main.postDelayed(new Runnable(){@Override public void run(){emitSpeech("ready", "self-test");}},60);
                    main.postDelayed(new Runnable(){@Override public void run(){emitSpeech("partial", "إنا أعطيناك");}},120);
                    main.postDelayed(new Runnable(){@Override public void run(){emitSpeech("final", "إنا أعطيناك الكوثر");}},180);
                    main.postDelayed(new Runnable(){@Override public void run(){emitSpeech("stopped", "self-test");}},240);
                }
            });
        }
    }

    public final class NativeVoiceBridge {
        @JavascriptInterface public boolean isRecording() { return recording; }
        @JavascriptInterface public void start() { runOnUiThread(new Runnable(){@Override public void run(){startVoiceRecording();}}); }
        @JavascriptInterface public void stop() { runOnUiThread(new Runnable(){@Override public void run(){stopVoiceRecording();}}); }
        @JavascriptInterface public String list() { return listRecordingsJson(); }
        @JavascriptInterface public void play(final String uri) { runOnUiThread(new Runnable(){@Override public void run(){playRecording(uri);}}); }
        @JavascriptInterface public void delete(final String uri) {
            runOnUiThread(new Runnable(){@Override public void run(){try{int n=getContentResolver().delete(Uri.parse(uri),null,null);emitVoice("deleted",String.valueOf(n));}catch(Throwable t){emitVoice("error","delete:"+t.getClass().getSimpleName());}}});
        }
    }

    public final class MicChromeClient extends WebChromeClient {
        @Override public void onPermissionRequest(final PermissionRequest request) {
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    try { request.grant(request.getResources()); }
                    catch (Throwable t) { try { request.deny(); } catch (Throwable ignored) {} }
                }
            });
        }
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_AUDIO) {
            boolean ok = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            emitSpeech("permission", ok ? "granted" : "denied");
            if (ok && pendingSpeechStart) {
                pendingSpeechStart = false;
                speechWanted = true;
                beginSpeechSession();
            } else if (!ok) {
                pendingSpeechStart = false;
                speechWanted = false;
                emitSpeech("fatal", "not-allowed");
            }
        }
    }

    @Override public void onBackPressed() {
        if (webView != null) webView.loadUrl("javascript:window.basairBack&&window.basairBack()");
        else super.onBackPressed();
    }

    @Override protected void onPause() {
        super.onPause();
        if (speechWanted) stopSpeech(true);
        if (recording) stopVoiceRecording();
    }

    @Override protected void onDestroy() {
        speechWanted = false;
        destroyRecognizer();
        releaseRecorder();
        if (voicePlayer != null) { try { voicePlayer.release(); } catch (Throwable ignored) {} voicePlayer = null; }
        if (webView != null) {
            try { webView.removeJavascriptInterface("BasairSpeech"); } catch (Throwable ignored) {}
            try { webView.removeJavascriptInterface("BasairVoice"); } catch (Throwable ignored) {}
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
