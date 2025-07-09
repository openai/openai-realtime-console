import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SessionStatusProps {
  isActive: boolean;
  transcript: string;
}

export const SessionStatus: React.FC<SessionStatusProps> = ({ isActive, transcript }) => {
  return (
    <View style={styles.container}>
      {transcript ? (
        <Text style={styles.transcript}>{transcript}</Text>
      ) : null}
      
      {isActive && (
        <Text style={styles.status}>🎤 Listening...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 20,
  },
  transcript: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  status: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});