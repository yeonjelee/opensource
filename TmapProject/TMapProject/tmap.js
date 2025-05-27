// tmap.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import TMapView from 'react-native-tmap';

const TMapScreen = () => {
  return (
    <View style={styles.container}>
      <TMapView
        style={{ flex: 1 }}
        apiKey="uR8rLdPPevlPKECWWLBBaWQLGYHBXHr9pEEm6dv3"
        centerPoint={{
          latitude: 37.5665,
          longitude: 126.9780
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
});

export default TMapScreen;
