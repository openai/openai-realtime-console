import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, View, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { RTCView } from 'react-native-webrtc-web-shim';
import * as Brightness from 'expo-brightness';
import { useRealtimeSession } from './hooks/useRealtimeSession';
import { SessionControls, SessionStatus } from './components';

const App = () => {
  const {
    isSessionActive,
    transcript,
    remoteMediaStream,
    startSession,
    stopSession,
  } = useRealtimeSession();

  useEffect(() => {
    // Request brightness permissions on mount
    (async () => {
      const { status } = await Brightness.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Brightness permission is required for some features to work properly.'
        );
      }
    })();
  }, []);

  const handleStartSession = async () => {
    try {
      await startSession();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start session');
      console.error('Failed to start session:', error);
    }
  };

  return (
    <>
      <StatusBar style="auto" />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <SessionControls
            isSessionActive={isSessionActive}
            onStart={handleStartSession}
            onStop={stopSession}
          />
          
          <SessionStatus
            isActive={isSessionActive}
            transcript={transcript}
          />
          
          <RTCView 
            stream={remoteMediaStream} 
            style={styles.rtcView}
          />
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  rtcView: {
    width: 0,
    height: 0,
  },
});

export default App;