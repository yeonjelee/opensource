package com.example.mysttapp

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import java.util.Locale // Locale 임포트 추가

// STT 결과를 콜백으로 전달하기 위한 인터페이스
interface SttListener {
    fun onSpeechResult(result: String)
    fun onSpeechError(errorMessage: String)
    fun onReadyForSpeech()
    fun onEndOfSpeech()
}

// listener를 var로 변경하고, setListener 메서드를 추가합니다.
// 그리고 RecognitionListener를 클래스 멤버로 분리하여 listener 변경 시 재설정할 수 있도록 합니다.
class SttManager(private val context: Context, private var listener: SttListener?) { // ⭐ listener를 var로 변경하고 nullable로 만듭니다.

    private var speechRecognizer: SpeechRecognizer? = null
    private var recognizerIntent: Intent? = null // Intent를 멤버 변수로 추가하여 재사용 및 설정 용이하게

    // RecognitionListener를 클래스 멤버로 정의하여 listener 변경 시 재설정 가능하게 합니다.
    private val recognitionListener = object : RecognitionListener {
        override fun onReadyForSpeech(params: Bundle?) {
            Log.d("SttManager", "Ready for speech")
            listener?.onReadyForSpeech() // ⭐ nullable 처리
        }

        override fun onBeginningOfSpeech() {
            Log.d("SttManager", "Beginning of speech")
        }

        override fun onRmsChanged(rmsdB: Float) {
            // Log.d("SttManager", "RmsChanged: $rmsdB") // 너무 자주 호출될 수 있음
        }

        override fun onBufferReceived(buffer: ByteArray?) {
            Log.d("SttManager", "Buffer received")
        }

        override fun onEndOfSpeech() {
            Log.d("SttManager", "End of speech")
            listener?.onEndOfSpeech() // ⭐ nullable 처리
        }

        override fun onError(error: Int) {
            val errorMessage = when (error) {
                SpeechRecognizer.ERROR_AUDIO -> "오디오 입력 에러" // 한국어 번역
                SpeechRecognizer.ERROR_CLIENT -> "클라이언트 에러"
                SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "권한 부족"
                SpeechRecognizer.ERROR_NETWORK -> "네트워크 에러"
                SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "네트워크 시간 초과"
                SpeechRecognizer.ERROR_NO_MATCH -> "일치하는 결과 없음"
                SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "인식기 사용 중"
                SpeechRecognizer.ERROR_SERVER -> "서버 에러"
                SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "말하기 시간 초과"
                else -> "알 수 없는 에러: $error" // 에러 코드 추가
            }
            Log.e("SttManager", "STT Error: $error ($errorMessage)")
            listener?.onSpeechError(errorMessage) // ⭐ nullable 처리
        }

        override fun onResults(results: Bundle?) {
            val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            if (!matches.isNullOrEmpty()) {
                val recognizedText = matches[0] // 가장 정확한 결과 사용
                Log.d("SttManager", "Recognized: $recognizedText")
                listener?.onSpeechResult(recognizedText) // ⭐ nullable 처리
            } else {
                listener?.onSpeechError("인식된 음성 없음") // ⭐ nullable 처리 및 한국어 번역
            }
        }

        override fun onPartialResults(partialResults: Bundle?) {
            val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            if (!matches.isNullOrEmpty()) {
                // 부분 결과 (선택 사항)
                // Log.d("SttManager", "Partial: ${matches[0]}")
            }
        }

        override fun onEvent(eventType: Int, params: Bundle?) {
            Log.d("SttManager", "Event: $eventType")
        }
    }


    init {
        initSpeechRecognizer()
    }

    private fun initSpeechRecognizer() {
        // SpeechRecognizer 인스턴스 생성
        if (SpeechRecognizer.isRecognitionAvailable(context)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
                setRecognitionListener(recognitionListener) // ⭐ 멤버 변수로 정의된 리스너 사용
            }
            // Intent도 init 시점에 기본값으로 생성
            recognizerIntent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault().toLanguageTag()) // 시스템 기본 언어 사용
                putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.packageName)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true) // 부분 결과 받기
            }
        } else {
            listener?.onSpeechError("이 기기에서는 음성 인식을 사용할 수 없습니다.") // ⭐ nullable 처리 및 한국어 번역
            Log.e("SttManager", "이 기기에서는 음성 인식을 사용할 수 없습니다.")
        }
    }

    // ⭐ 추가: SttListener를 동적으로 변경하는 메서드
    fun setListener(newListener: SttListener) {
        this.listener = newListener
        // 리스너가 변경되었으므로, SpeechRecognizer에도 새로운 리스너를 다시 설정합니다.
        // 이는 기존 리스너의 콜백이 아닌 새 리스너의 콜백이 호출되도록 보장합니다.
        // 하지만 실제로는 recognitionListener 객체 자체가 동일하므로, 내부의 listener 참조만 변경됩니다.
        // 따라서 여기서 setRecognitionListener를 다시 호출할 필요는 없습니다.
        // speechRecognizer?.setRecognitionListener(recognitionListener) // 이 줄은 필요 없음
    }


    // 음성 인식 시작
    fun startListening(prompt: String = "", language: String = "ko-KR") {
        if (speechRecognizer == null) {
            // SpeechRecognizer가 null이면 초기화 시도 후 다시 확인
            initSpeechRecognizer()
            if (speechRecognizer == null) { // 여전히 null이면 에러 보고
                listener?.onSpeechError("SpeechRecognizer가 초기화되지 않았습니다.") // ⭐ nullable 처리 및 한국어 번역
                return
            }
        }

        // 새 Intent를 생성하는 대신, 기존 recognizerIntent를 복사하고 설정을 변경
        val currentIntent = Intent(recognizerIntent).apply { // ⭐ 기존 Intent 재사용 및 수정
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
            if (prompt.isNotEmpty()) {
                putExtra(RecognizerIntent.EXTRA_PROMPT, prompt)
            } else {
                removeExtra(RecognizerIntent.EXTRA_PROMPT) // prompt가 없으면 제거
            }
        }
        speechRecognizer?.startListening(currentIntent)
        Log.d("SttManager", "Start listening with prompt: $prompt")
    }

    // 음성 인식 중지
    fun stopListening() {
        speechRecognizer?.stopListening()
        Log.d("SttManager", "Stop listening")
    }

    // SpeechRecognizer 자원 해제
    fun destroy() {
        speechRecognizer?.destroy()
        speechRecognizer = null
        Log.d("SttManager", "SpeechRecognizer destroyed")
    }
}