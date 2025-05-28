// App.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import {
  Camera,
  useCameraDevices,
  CameraDevice,
} from 'react-native-vision-camera';

const App = (): JSX.Element => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const devices = useCameraDevices();
  const device: CameraDevice | undefined = devices.back;

  // 권한 요청 및 상태 확인
  useEffect(() => {
    const checkPermission = async () => {
      const currentStatus = await Camera.getCameraPermissionStatus();
      console.log('🔐 현재 권한 상태:', currentStatus);

      const result = await Camera.requestCameraPermission();
      console.log('📋 권한 요청 결과:', result);

      setHasPermission(result === 'authorized');
    };
    checkPermission();
  }, []);

  // 디바이스 상태 확인 로그
  useEffect(() => {
    console.log('📸 전체 디바이스:', devices);
    console.log('🎯 선택된 디바이스 (back):', device);
  }, [devices]);

  // 권한 없음
  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>🔒 카메라 권한이 필요합니다.</Text>
      </View>
    );
  }

  // 디바이스 없음
  if (device == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>📷 사용할 수 있는 카메라가 없습니다.</Text>
      </View>
    );
  }

  // 모든 조건 만족 → 카메라 표시
  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
      />
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { fontSize: 18, textAlign: 'center' },
});
