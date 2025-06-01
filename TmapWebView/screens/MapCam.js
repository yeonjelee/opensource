import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const MapCam = ({navigation}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.text}>Cam 영역</Text>
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
  text: { fontSize: 18 },
  topSection: {
    borderWidth: 1,       
    borderColor: 'black',  
    borderRadius: 10, 
    flex: 1,
    backgroundColor: '#d0e6f7', 
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
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
