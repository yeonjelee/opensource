import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Tts from 'react-native-tts';
import HomeScreen from './screens/HomeScreen.js';

Tts.setDefaultLanguage('ko-KR');
Tts.setDefaultRate(0.5);

export default function App() {
  useEffect(() => {
    // 앱 시작 시 자동으로 말하기
    Tts.speak('앱을 시작하시겠습니까?');
  }, []);

  return (
    <View style={styles.container}>
      {/* 버튼 없음 */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,  // 전체 화면 차지
    justifyContent: 'center',
    alignItems: 'center',
  },
});
