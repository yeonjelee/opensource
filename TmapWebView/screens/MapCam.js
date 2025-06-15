import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';

const MapCam = ({ navigation }) => {
  const camera = useRef(null);
  const devices = useCameraDevices();
  const device = devices.back || devices.find(d => d.position === 'back');
  const [hasPermission, setHasPermission] = useState(false);

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
        <Text style={styles.text}>Map 영역</Text>
      </View>

      <Button title="HomeScreen" onPress={() => navigation.navigate('HomeScreen')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: 'black' },
  topSection: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
    flex: 1,
    backgroundColor: '#d0e6f7',
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    overflow: 'hidden', // 카메라 화면 넘침 방지
  },
  bottomSection: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
    flex: 1,
    backgroundColor: '#d0e6f7',
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
  },
});

export default MapCam;
