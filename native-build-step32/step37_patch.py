from pathlib import Path
p=Path('native-build-step32/app/basair/quran/MainActivity.java')
s=p.read_text()
old='''    private void stopSpeech(boolean cancel) {\n        speechWanted = false;\n        pendingSpeechStart = false;\n        restartGeneration++;\n        speechReady = false;\n        if (recognizer != null) {\n            try {\n                if (cancel) recognizer.cancel();\n                else recognizer.stopListening();\n            } catch (Throwable ignored) {}\n        }\n        speechSessionActive = false;\n        emitSpeech("stopped", cancel ? "cancel" : "stop");\n    }\n'''
new='''    private void stopSpeech(boolean cancel) {\n        speechWanted = false;\n        pendingSpeechStart = false;\n        restartGeneration++;\n        speechReady = false;\n        if (recognizer != null) {\n            try {\n                if (cancel) recognizer.cancel();\n                else recognizer.stopListening();\n            } catch (Throwable ignored) {}\n        }\n        speechSessionActive = false;\n        if (cancel) {\n            try { if (recognizer != null) recognizer.destroy(); } catch (Throwable ignored) {}\n            recognizer = null;\n        }\n        emitSpeech("stopped", cancel ? "cancel" : "stop");\n    }\n'''
assert old in s, 'stopSpeech pattern missing'
s=s.replace(old,new)
old='''        resumeSpeechAfterRecording = speechWanted;\n        stopSpeech(true);\n        main.postDelayed(new Runnable() {\n'''
new='''        resumeSpeechAfterRecording = speechWanted;\n        stopSpeech(true);\n        destroyRecognizer();\n        emitVoice("preparing", resumeSpeechAfterRecording ? "pause-tasmee" : "voice-only");\n        main.postDelayed(new Runnable() {\n'''
assert old in s, 'record start pattern missing'
s=s.replace(old,new)
s=s.replace('''        }, 420);\n    }\n''','''        }, 820);\n    }\n''',1)
s=s.replace('''            scheduleSpeechRestart(520, "after-recording");\n''','''            scheduleSpeechRestart(850, "after-recording");\n''')
s=s.replace('''@JavascriptInterface public void stop() { runOnUiThread(new Runnable() { @Override public void run() { stopSpeech(false); } }); }''','''@JavascriptInterface public void stop() { runOnUiThread(new Runnable() { @Override public void run() { stopSpeech(true); } }); }''')
p.write_text(s)
print('STEP37 native patch applied')
