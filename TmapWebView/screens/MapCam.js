import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { WebView } from 'react-native-webview';

const MapCam = ({ navigation }) => {
  const camera = useRef(null);
  const webViewRef = useRef(null);
  const devices = useCameraDevices();
  const device = devices.back || devices.find(d => d.position === 'back');
  const [hasPermission, setHasPermission] = useState(false);
  
  // 경로 설정을 위한 상태
  const [showRouteInput, setShowRouteInput] = useState(false);
  const [startLat, setStartLat] = useState('37.564991');
  const [startLng, setStartLng] = useState('126.983937');
  const [endLat, setEndLat] = useState('37.566158');
  const [endLng, setEndLng] = useState('126.988940');
  const [startName, setStartName] = useState('출발지');
  const [endName, setEndName] = useState('도착지');
  const [searchMode, setSearchMode] = useState(true); // true: 건물명 검색, false: 직접 좌표 입력
  const [isSearching, setIsSearching] = useState(false);

  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        const cameraGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setHasPermission(cameraGranted);
        if (!cameraGranted) {
          Alert.alert('권한 필요', '카메라 권한이 필요합니다.');
        }
      } else {
        const permission = await Camera.requestCameraPermission();
        setHasPermission(permission === 'authorized');
      }
    } catch (error) {
      console.error('카메라 권한 요청 실패:', error);
    }
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  // WebView에서 메시지를 받는 함수
  const handleWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('WebView Message:', message);
      
      if (message.type === 'currentLocation') {
        console.log('현재 위치:', message.data);
        // 현재 위치 정보를 활용한 추가 로직 구현 가능
      }
    } catch (error) {
      console.error('WebView 메시지 파싱 오류:', error);
    }
  };

  // 수정된 POI 검색 함수 - T-map API 대신 Nominatim API 사용
  const searchPOI = async (query) => {
    try {
      console.log('POI 검색 시작:', query);
      
      // Nominatim API 사용 (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' 한국')}&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MapCamApp/1.0'
          }
        }
      );

      const data = await response.json();
      console.log('검색 결과:', data);
      
      if (data && data.length > 0) {
        const result = data[0];
        return {
          name: result.display_name.split(',')[0] || query,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name
        };
      } else {
        // 대안으로 한국 지역 검색 시도
        const fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=kr&limit=1`,
          {
            headers: {
              'User-Agent': 'MapCamApp/1.0'
            }
          }
        );
        
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData && fallbackData.length > 0) {
          const result = fallbackData[0];
          return {
            name: result.display_name.split(',')[0] || query,
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            address: result.display_name
          };
        }
        
        throw new Error('검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error('POI 검색 오류:', error);
      throw new Error('검색 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
    }
  };

  // 카카오 API를 사용한 대안 검색 함수 (주석 처리된 상태로 제공)
  const searchPOIKakao = async (query) => {
    // 카카오 API 키가 필요합니다
    const KAKAO_API_KEY = 'YOUR_KAKAO_REST_API_KEY'; // 실제 키로 변경 필요
    
    try {
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `KakaoAK ${KAKAO_API_KEY}`
          }
        }
      );

      const data = await response.json();
      
      if (data.documents && data.documents.length > 0) {
        const place = data.documents[0];
        return {
          name: place.place_name,
          lat: parseFloat(place.y),
          lng: parseFloat(place.x),
          address: place.address_name
        };
      } else {
        throw new Error('검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error('카카오 POI 검색 오류:', error);
      throw error;
    }
  };

  // 경로 설정 함수 (건물명 검색 모드)
  const setRouteBySearch = async () => {
    if (!startName.trim() || !endName.trim()) {
      Alert.alert('오류', '출발지와 도착지 이름을 입력해주세요.');
      return;
    }

    setIsSearching(true);
    
    try {
      console.log('출발지 검색:', startName.trim());
      // 출발지 검색
      const startResult = await searchPOI(startName.trim());
      console.log('출발지 결과:', startResult);
      
      setStartLat(startResult.lat.toString());
      setStartLng(startResult.lng.toString());

      console.log('도착지 검색:', endName.trim());
      // 도착지 검색
      const endResult = await searchPOI(endName.trim());
      console.log('도착지 결과:', endResult);
      
      setEndLat(endResult.lat.toString());
      setEndLng(endResult.lng.toString());

      // WebView에 경로 설정
      const script = `
        if (window.setCustomRoute) {
          window.setCustomRoute(${startResult.lat}, ${startResult.lng}, ${endResult.lat}, ${endResult.lng}, "${startResult.name}", "${endResult.name}");
        }
        true;
      `;
      
      webViewRef.current?.injectJavaScript(script);
      setShowRouteInput(false);
      
      Alert.alert('성공', `경로가 설정되었습니다.\n출발지: ${startResult.name}\n도착지: ${endResult.name}`);
      
    } catch (error) {
      console.error('검색 실패:', error);
      Alert.alert('검색 실패', error.message || '장소를 찾을 수 없습니다. 다른 키워드로 시도해보세요.');
    } finally {
      setIsSearching(false);
    }
  };

  // 경로 설정 함수 (직접 좌표 입력 모드)
  const setRouteByCoordinates = () => {
    if (!startLat || !startLng || !endLat || !endLng) {
      Alert.alert('오류', '모든 좌표를 입력해주세요.');
      return;
    }

    const script = `
      if (window.setCustomRoute) {
        window.setCustomRoute(${startLat}, ${startLng}, ${endLat}, ${endLng}, "${startName}", "${endName}");
      }
      true;
    `;
    
    webViewRef.current?.injectJavaScript(script);
    setShowRouteInput(false);
  };

  // 통합 경로 설정 함수
  const setRoute = () => {
    if (searchMode) {
      setRouteBySearch();
    } else {
      setRouteByCoordinates();
    }
  };

  // 현재 위치 가져오기
  const getCurrentLocation = () => {
    const script = `
      if (window.getCurrentLocation) {
        window.getCurrentLocation();
      }
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
  };

  // 기본 경로로 복원
  const resetToDefault = () => {
    setStartLat('37.564991');
    setStartLng('126.983937');
    setEndLat('37.566158');
    setEndLng('126.988940');
    setStartName('출발지');
    setEndName('도착지');
    
    const script = `
      if (window.setCustomRoute) {
        window.setCustomRoute(37.564991, 126.983937, 37.566158, 126.988940, "출발지", "도착지");
      }
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        {hasPermission && device ? (
          <Camera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            photo={false}
          />
        ) : (
          <Text style={styles.text}>카메라 준비 중...</Text>
        )}
      </View>

      <View style={styles.bottomSection}>
        <WebView
          ref={webViewRef}
          source={{ uri: 'file:///android_asset/navigation.html' }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          geolocationEnabled={true}
          originWhitelist={['*']}
          mixedContentMode='always'
          onMessage={handleWebViewMessage}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView Error:', nativeEvent);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView HTTP Error:', nativeEvent);
          }}
          androidLayerType='software'
          renderToHardwareTextureAndroid={false}
        />
        
        {/* 경로 설정 버튼들 */}
        <View style={styles.controlButtons}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => setShowRouteInput(!showRouteInput)}
          >
            <Text style={styles.buttonText}>경로 설정</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={getCurrentLocation}>
            <Text style={styles.buttonText}>현재 위치</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={resetToDefault}>
            <Text style={styles.buttonText}>기본값</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 경로 입력 폼 */}
      {showRouteInput && (
        <View style={styles.routeInputContainer}>
          {/* 검색 모드 토글 버튼 */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleButton, searchMode && styles.toggleButtonActive]}
              onPress={() => setSearchMode(true)}
            >
              <Text style={[styles.toggleButtonText, searchMode && styles.toggleButtonTextActive]}>
                건물명 검색
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, !searchMode && styles.toggleButtonActive]}
              onPress={() => setSearchMode(false)}
            >
              <Text style={[styles.toggleButtonText, !searchMode && styles.toggleButtonTextActive]}>
                직접 입력
              </Text>
            </TouchableOpacity>
          </View>

          {searchMode ? (
            // 건물명 검색 모드
            <>
              <Text style={styles.helperText}>
                건물명이나 주소를 입력하면 자동으로 좌표를 찾아드립니다.
              </Text>
              <View style={styles.inputRow}>
                <Text style={styles.label}>출발지:</Text>
                <TextInput
                  style={styles.input}
                  value={startName}
                  onChangeText={setStartName}
                  placeholder="예: 경복궁, 서울역, 남산타워"
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.label}>도착지:</Text>
                <TextInput
                  style={styles.input}
                  value={endName}
                  onChangeText={setEndName}
                  placeholder="예: 명동, 홍대입구역, 강남역"
                />
              </View>
            </>
          ) : (
            // 직접 좌표 입력 모드
            <>
              <Text style={styles.helperText}>
                위도, 경도를 직접 입력해주세요.
              </Text>
              <View style={styles.inputRow}>
                <Text style={styles.label}>출발지명:</Text>
                <TextInput
                  style={styles.input}
                  value={startName}
                  onChangeText={setStartName}
                  placeholder="출발지명"
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.label}>출발 위도:</Text>
                <TextInput
                  style={styles.input}
                  value={startLat}
                  onChangeText={setStartLat}
                  placeholder="37.564991"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.label}>출발 경도:</Text>
                <TextInput
                  style={styles.input}
                  value={startLng}
                  onChangeText={setStartLng}
                  placeholder="126.983937"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.label}>도착지명:</Text>
                <TextInput
                  style={styles.input}
                  value={endName}
                  onChangeText={setEndName}
                  placeholder="도착지명"
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.label}>도착 위도:</Text>
                <TextInput
                  style={styles.input}
                  value={endLat}
                  onChangeText={setEndLat}
                  placeholder="37.566158"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.label}>도착 경도:</Text>
                <TextInput
                  style={styles.input}
                  value={endLng}
                  onChangeText={setEndLng}
                  placeholder="126.988940"
                  keyboardType="numeric"
                />
              </View>
            </>
          )}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.applyButton, isSearching && styles.disabledButton]} 
              onPress={setRoute}
              disabled={isSearching}
            >
              <Text style={styles.buttonText}>
                {isSearching ? '검색 중...' : '경로 적용'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowRouteInput(false)}
            >
              <Text style={styles.buttonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Button
        title="HomeScreen"
        onPress={() => navigation.navigate('HomeScreen')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  text: { 
    fontSize: 18, 
    color: 'black' 
  },
  topSection: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
    flex: 1,
    backgroundColor: '#d0e6f7',
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    overflow: 'hidden',
  },
  bottomSection: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
    flex: 1,
    backgroundColor: '#d0e6f7',
    width: '90%',
    position: 'relative',
  },
  webview: {
    flex: 1,
    borderRadius: 10,
  },
  controlButtons: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 5,
  },
  button: {
    backgroundColor: '#007bff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeInputContainer: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: '70%',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#007bff',
  },
  toggleButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  toggleButtonTextActive: {
    color: 'white',
  },
  helperText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    width: 80,
    fontSize: 12,
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 5,
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
});

export default MapCam;
