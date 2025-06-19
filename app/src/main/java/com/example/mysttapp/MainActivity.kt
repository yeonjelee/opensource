package com.example.mysttapp // <-- 본인 프로젝트의 실제 패키지명으로 변경해주세요! (현재는 com.example.mysttapp)

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.navigation.NavController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
// 아래 import 문을 본인의 실제 테마 패키지명으로 변경해주세요!
import com.example.mysttapp.ui.theme.MySttAppTheme // <-- 이 부분을 확인하고 수정하세요!

// MainActivity 클래스
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            // 아래 테마 이름도 본인의 실제 테마 이름으로 변경해주세요!
            MySttAppTheme { // <-- 이 부분을 확인하고 수정하세요! (일반적으로 MySttAppTheme)
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    SttComposeApp()
                }
            }
        }
    }
}

// 전체 STT 앱의 Compose UI
@Composable
fun SttComposeApp() {
    val navController = rememberNavController()
    val context = LocalContext.current
    // val activity = context as? ComponentActivity // 이 변수는 사용되지 않아 주석 처리했습니다.

    // 권한 요청 런처
    val requestPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            Log.d("SttComposeApp", "RECORD_AUDIO permission granted.")
            // 권한이 부여되면 초기 화면으로 이동
            navController.navigate("initialScreen") {
                // 이전 스택을 클리어하여 뒤로 가기 버튼으로 다시 권한 요청 화면으로 돌아가지 않도록 합니다.
                popUpTo("initialScreen") { inclusive = true }
            }
        } else {
            Log.d("SttComposeApp", "RECORD_AUDIO permission denied.")
            // 권한 거부 시 사용자에게 알림 (여기서는 앱 종료 또는 기능 제한 로직 추가 가능)
            // 예를 들어, 다이얼로그를 띄우거나, 앱을 종료하는 등의 처리를 할 수 있습니다.
            // (context as? ComponentActivity)?.finish() // 예시: 권한 없으면 앱 종료
        }
    }

    // 권한 확인 및 요청 로직 (앱 진입 시 실행)
    LaunchedEffect(Unit) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            // 권한이 없으면 요청
            requestPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        } else {
            // 권한이 이미 있다면 바로 초기 화면으로 이동
            Log.d("SttComposeApp", "RECORD_AUDIO permission already granted.")
            navController.navigate("initialScreen") {
                popUpTo("initialScreen") { inclusive = true }
            }
        }
    }

    // Compose Navigation Host
    NavHost(navController = navController, startDestination = "loadingScreen") {
        composable("loadingScreen") {
            // 권한 확인 중 로딩 화면
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("마이크 권한 확인 중...")
            }
        }
        composable("initialScreen") {
            InitialScreen(navController = navController)
        }
        composable("mainAppScreen") {
            MainAppScreen()
        }
    }
}

// "시작하시겠습니까?" 화면
@Composable
fun InitialScreen(navController: NavController) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var sttManager: SttManager? by remember { mutableStateOf(null) }
    var ttsManager: TtsManager? by remember { mutableStateOf(null) }

    var statusText by remember { mutableStateOf("앱 시작 대기 중...") }

    // TTS 준비 완료 리스너
    val ttsReadyListener = remember {
        object : TtsReadyListener {
            override fun onTtsReady() {
                coroutineScope.launch {
                    statusText = "TTS 준비 완료. '시작하시겠습니까?'"
                    delay(500) // TTS가 말하기 전에 잠시 기다림
                    ttsManager?.speak("시작하시겠습니까?")
                    delay(4000) // TTS가 말하는 시간 고려 (이 값은 조절 필요)
                    sttManager?.startListening(prompt = "네 라고 말씀해주세요.")
                    statusText = "말씀해주세요: 네"
                }
            }
        }
    }

    // STT 리스너
    val sttListener = remember {
        object : SttListener {
            override fun onReadyForSpeech() {
                statusText = "듣는 중..."
            }

            override fun onEndOfSpeech() {
                statusText = "인식 중..."
            }

            override fun onSpeechResult(result: String) {
                val lowerCaseResult = result.lowercase()
                Log.d("InitialScreen", "인식 결과: $lowerCaseResult")
                if (lowerCaseResult.contains("네") || lowerCaseResult.contains("예")) {
                    statusText = "'네' 인식. 다음 화면으로 이동합니다."
                    navController.navigate("mainAppScreen") {
                        popUpTo("initialScreen") { inclusive = true } // 이전 화면 스택 제거
                    }
                } else {
                    statusText = "'네'가 아닙니다. 다시 말씀해주세요: 네"
                    coroutineScope.launch {
                        ttsManager?.speak("다시 말씀해주세요. 시작하시겠습니까?")
                        delay(1500)
                        sttManager?.startListening(prompt = "네 라고 말씀해주세요.")
                    }
                }
            }

            override fun onSpeechError(errorMessage: String) {
                statusText = "에러: $errorMessage"
                Log.e("InitialScreen", "STT Error: $errorMessage")
                coroutineScope.launch {
                    ttsManager?.speak("음성 인식에 오류가 발생했습니다. 다시 시도해주세요.")
                    delay(3500)
                    sttManager?.startListening(prompt = "네 라고 말씀해주세요.")
                }
            }
        }
    }

    // 컴포저블의 생명주기 관리 (초기화 및 자원 해제)
    DisposableEffect(Unit) {
        ttsManager = TtsManager(context, ttsReadyListener)
        sttManager = SttManager(context, sttListener)
        onDispose {
            sttManager?.destroy()
            ttsManager?.shutdown()
        }
    }

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = statusText, modifier = Modifier.padding(16.dp))
    }
}

// 출발지/목적지 입력 화면
@Composable
fun MainAppScreen() {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var sttManager: SttManager? by remember { mutableStateOf(null) }
    var ttsManager: TtsManager? by remember { mutableStateOf(null) }

    var statusText by remember { mutableStateOf("출발지/목적지 인식 준비 중...") }
    var recognizedText by remember { mutableStateOf("") }
    var departureText by remember { mutableStateOf("출발지: ") }
    var arrivalText by remember { mutableStateOf("도착지: ") }

    // TTS 준비 완료 리스너 (MainAppScreen에서도 TTS가 필요할 경우)
    val ttsReadyListener = remember {
        object : TtsReadyListener {
            override fun onTtsReady() {
                coroutineScope.launch {
                    statusText = "TTS 준비 완료. '출발지와 목적지를 말씀해주세요.'"
                    delay(500)
                    ttsManager?.speak("출발지와 목적지를 말씀해주세요.")
                    delay(4000) // TTS가 말하는 시간 고려
                    sttManager?.startListening(prompt = "출발지와 목적지를 말씀해주세요.")
                    statusText = "말씀해주세요: 출발지와 목적지"
                }
            }
        }
    }

    // STT 리스너
    val sttListener = remember {
        object : SttListener {
            override fun onReadyForSpeech() {
                statusText = "듣는 중..."
            }

            override fun onEndOfSpeech() {
                statusText = "인식 중..."
            }

            // ... (MainAppScreen 안의 sttListener)
            override fun onSpeechResult(result: String) {
                recognizedText = result
                statusText = "인식됨: $result"
                val (departure, arrival) = parseDepartureAndArrival(result) // 파싱 함수 호출

                if (departure != null) {
                    departureText = "출발지: $departure"
                } else {
                    departureText = "출발지: (인식 실패)"
                }
                if (arrival != null) {
                    arrivalText = "도착지: $arrival"
                } else {
                    arrivalText = "도착지: (인식 실패)"
                }

                if (departure == null || arrival == null) {
                    // 파싱 실패 시: 다시 시도 요청
                    coroutineScope.launch {
                        ttsManager?.speak("출발지나 목적지 정보가 불분명합니다. 다시 말씀해주세요.")
                        // 💡 TTS 음성 길이를 고려하여 delay 충분히 늘리기
                        delay(4000) // "출발지나 목적지 정보가 불분명합니다. 다시 말씀해주세요." TTS 시간 고려
                        sttManager?.startListening(prompt = "출발지와 목적지를 다시 말씀해주세요.")
                        statusText = "다시 말씀해주세요."
                    }
                } else {
                    // 💡 파싱 성공 시: 다음 화면으로 전환 또는 지도 로직 실행
                    Log.d("MainAppScreen", "최종 추출 - 출발지: $departure, 도착지: $arrival")
                    coroutineScope.launch {
                        ttsManager?.speak("$departure 에서 $arrival 로 경로를 검색합니다.")
                        // TTS가 말을 마칠 때까지 충분히 기다립니다.
                        delay(3000) // TTS 문장 길이에 따라 조절

                        // ⭐ 다음 화면으로 전환하는 로직 추가 (예시)
                        // MainAppScreen은 이미 최종 화면이므로, 여기서는 앱 종료 또는 다른 액티비티 시작으로 처리할 수 있습니다.
                        // NavController가 MainAppScreen에서는 없으므로, Activity를 종료하거나 외부 인텐트를 사용하는 것이 현실적입니다.
                        // 여기서는 일단 로그 출력 후, 앱 종료를 예시로 들어보겠습니다.
                        // (context as? ComponentActivity)?.finish() // 앱 종료

                        // 아니면, 친구분이 지도 연동을 할 수 있도록 정보를 넘겨주는 로직을 추가합니다.
                        // 예를 들어, 다른 Activity를 시작하면서 출발지/목적지 정보를 Intent로 넘겨줄 수 있습니다.
                        statusText = "경로 검색 완료. 앱을 종료하거나 다른 작업을 시작합니다."
                        Log.d("MainAppScreen", "모든 음성 기능 완료.")

                        // ⭐ 중요: STT/TTS 자원 해제
                        sttManager?.destroy()
                        ttsManager?.shutdown()
                    }
                }
            }
// ...

            override fun onSpeechError(errorMessage: String) {
                statusText = "에러: $errorMessage"
                Log.e("MainAppScreen", "STT Error: $errorMessage")
                coroutineScope.launch {
                    ttsManager?.speak("음성 인식에 오류가 발생했습니다. 다시 시도해주세요.")
                    delay(5000)
                    sttManager?.startListening(prompt = "출발지와 목적지를 다시 말씀해주세요.")
                }
            }
        }
    }

    // 컴포저블의 생명주기 관리 (초기화 및 자원 해제)
    DisposableEffect(Unit) {
        ttsManager = TtsManager(context, ttsReadyListener)
        sttManager = SttManager(context, sttListener)
        onDispose {
            sttManager?.destroy()
            ttsManager?.shutdown()
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = statusText, modifier = Modifier.padding(bottom = 8.dp))
        Text(text = "인식된 전체 문장: $recognizedText", modifier = Modifier.padding(bottom = 8.dp))
        Text(text = departureText, modifier = Modifier.padding(bottom = 4.dp))
        Text(text = arrivalText, modifier = Modifier.padding(bottom = 16.dp))

        Button(onClick = {
            sttManager?.stopListening() // 현재 듣는 중이면 중지
            coroutineScope.launch { // <-- 이 부분을 추가합니다.
                delay(1000) // <-- 이 부분을 추가합니다. (1초 딜레이)
                sttManager?.startListening(prompt = "출발지와 목적지를 말씀해주세요.")
                statusText = "다시 듣기 시작"
            }
        }) {
            Text("다시 말하기")
        }
    }
}

// 음성 파싱 함수 (MainAppScreen 외부, 또는 별도 유틸 파일에 두는 것이 좋음)
// 이 함수는 MainActivity 클래스 바깥, 파일의 가장 하단에 위치해야 합니다.
fun parseDepartureAndArrival(command: String): Pair<String?, String?> {
    var departure: String? = null
    var arrival: String? = null

    // 소문자로 변환하여 일관성 있게 파싱
    val lowerCaseCommand = command.lowercase()

    // 1. "출발지는 X이고 도착지는 Y이야" 또는 "출발지는 X이고 도착지는 Y"
    val pattern1 = "출발지는\\s*([^이고]+)이고\\s*도착지는\\s*([^.\\s]+)(?:이야)?".toRegex()
    val match1 = pattern1.find(lowerCaseCommand)
    if (match1 != null) {
        departure = match1.groupValues[1].trim()
        arrival = match1.groupValues[2].trim()
        Log.d("VoiceParsing", "Pattern 1 Matched: Dep=$departure, Arr=$arrival (Command: $command)")
        return Pair(departure, arrival)
    }

    // 2. "출발지는 X, 도착지는 Y" 또는 "출발지 X, 도착지 Y"
    val pattern2 = "(?:출발지는|출발지)\\s*([^,]+)(?:,|이고)\\s*(?:도착지는|도착지)\\s*(.+)".toRegex()
    val match2 = pattern2.find(lowerCaseCommand)
    if (match2 != null) {
        departure = match2.groupValues[1].trim()
        arrival = match2.groupValues[2].trim()
        Log.d("VoiceParsing", "Pattern 2 Matched: Dep=$departure, Arr=$arrival (Command: $command)")
        return Pair(departure, arrival)
    }

    // 3. "X에서 Y까지"
    val pattern3 = "(.+)에서\\s*(.+)까지".toRegex()
    val match3 = pattern3.find(lowerCaseCommand)
    if (match3 != null) {
        departure = match3.groupValues[1].trim()
        arrival = match3.groupValues[2].trim()
        Log.d("VoiceParsing", "Pattern 3 Matched: Dep=$departure, Arr=$arrival (Command: $command)")
        return Pair(departure, arrival)
    }

    // 4. "X로 Y로" (이 패턴은 오해의 소지가 있어 주의 필요)
    val pattern4 = "(.+)로\\s*(.+)로".toRegex()
    val match4 = pattern4.find(lowerCaseCommand)
    if (match4 != null) {
        departure = match4.groupValues[1].trim()
        arrival = match4.groupValues[2].trim()
        Log.d("VoiceParsing", "Pattern 4 Matched: Dep=$departure, Arr=$arrival (Command: $command)")
        return Pair(departure, arrival)
    }

    // 5. "X, Y" (콤마로 구분된 경우, 가장 모호함)
    val pattern5 = "([^,]+),\\s*(.+)".toRegex()
    val match5 = pattern5.find(lowerCaseCommand)
    if (match5 != null) {
        // 이 패턴은 너무 광범위하므로, 사용 시 주의하거나 더 명확한 문맥이 필요
        // 여기서는 출발지와 목적지를 명시적으로 언급하지 않은 경우에 대한 마지막 시도
        val parts = lowerCaseCommand.split(",").map { it.trim() }
        if (parts.size >= 2) {
            departure = parts[0]
            arrival = parts[1]
            Log.d("VoiceParsing", "Pattern 5 Matched: Dep=$departure, Arr=$arrival (Command: $command)")
            return Pair(departure, arrival)
        }
    }

    Log.w("VoiceParsing", "No specific pattern matched for: $command")
    return Pair(null, null)
}