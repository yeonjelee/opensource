import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
  Dimensions,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';

const { width, height } = Dimensions.get('window');

const App = () => {
  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices?.back || devices?.find(d => d.position === 'back');
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // 디버깅용 - 사용 가능한 카메라 확인
  useEffect(() => {
    console.log('Available devices:', devices);
    console.log('Selected device:', device);
  }, [devices, device]);

  // 권한 요청 함수
  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        
        const cameraGranted = granted[PermissionsAndroid.PERMISSIONS.CAMERA] === 'granted';
        setHasPermission(cameraGranted);
        
        if (!cameraGranted) {
          Alert.alert('권한 필요', '카메라 권한이 필요합니다.');
        }
      } else {
        const permission = await Camera.requestCameraPermission();
        setHasPermission(permission === 'authorized');
      }
    } catch (error) {
      console.error('권한 요청 실패:', error);
    }
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  // 권한이 없는 경우
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>카메라 권한이 필요합니다</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermissions}>
          <Text style={styles.buttonText}>권한 요청</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 카메라 디바이스가 없는 경우
  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>카메라를 찾을 수 없습니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        photo={false}
      />
      
      {/* 상단 상태 표시 */}
      <View style={styles.overlay}>
        <Text style={styles.title}>실시간 카메라</Text>
        <Text style={styles.statusText}>객체 탐지 대기 중...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // 카메라 오버레이 스타일
  overlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
    zIndex: 1,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusText: {
    color: '#4CAF50',
    fontSize: 16,
  },
});

export default App;