// App.js
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Tts from 'react-native-tts';

Tts.setDefaultLanguage('ko-KR'); // 한국어
Tts.setDefaultRate(0.5);

export default function App() {
  useEffect(() => {
    // 앱 실행 시 딱 한 번 실행
    Tts.speak('시작하시겠습니까?');
  }, []);

  return (
    <View style={styles.container}>
      {/* 버튼은 없어도 됨 */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 100,
    alignItems: 'center',
  },
});
