import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import Tts from 'react-native-tts'; // 📌 TTS 추가

const HomeScreen = ({ navigation }) => {
  useEffect(() => {
    Tts.setDefaultLanguage('ko-KR'); // 한국어 설정
    Tts.setDefaultRate(0.5); // 말하기 속도 설정
    Tts.speak('앱을 시작하시겠습니까?'); // 말하기
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>HomeScreen</Text>
      <View style={styles.webviewContainer}>
        <WebView
          source={{ uri: 'file:///android_asset/tmap.html' }}
          originWhitelist={['*']}
          allowFileAccess={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          style={{ width: 280, height: 350 }}
          onLoadStart={() => console.log('📡 WebView Load Started')}
          onLoadEnd={() => console.log('✅ WebView Load Ended')}
          onError={(e) => console.warn('WebView error:', e.nativeEvent)}
          onHttpError={(e) => console.warn('HTTP error:', e.nativeEvent.statusCode)}
        />
      </View>

      <Button title="MapCam" onPress={() => navigation.navigate('MapCam')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  text: { fontSize: 18, marginBottom: 20, textAlign: 'center' },
  webviewContainer: { flex: 1, borderWidth: 1, borderColor: 'red', margin: 10 },
});

export default HomeScreen;
