package com.example.mysttapp


import android.content.Context
import android.speech.tts.TextToSpeech
import android.util.Log
import java.util.Locale

// TTS 준비 완료 콜백을 위한 인터페이스
interface TtsReadyListener {
    fun onTtsReady()
}

class TtsManager(private val context: Context, private val listener: TtsReadyListener) {

    private var textToSpeech: TextToSpeech? = null

    init {
        textToSpeech = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val result = textToSpeech?.setLanguage(Locale.KOREA)
                if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    Log.e("TtsManager", "Korean language not supported.")
                } else {
                    Log.d("TtsManager", "TTS ready.")
                    listener.onTtsReady()
                }
            } else {
                Log.e("TtsManager", "TTS initialization failed.")
            }
        }
    }

    fun speak(text: String) {
        textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, null)
        Log.d("TtsManager", "Speaking: $text")
    }

    fun stop() {
        textToSpeech?.stop()
    }

    fun shutdown() {
        textToSpeech?.shutdown()
        textToSpeech = null
        Log.d("TtsManager", "TTS shutdown.")
    }
}