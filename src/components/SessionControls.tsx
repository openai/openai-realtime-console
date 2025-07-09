import React from 'react';
import { View, Button, StyleSheet } from 'react-native';

interface SessionControlsProps {
  isSessionActive: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const SessionControls: React.FC<SessionControlsProps> = ({
  isSessionActive,
  onStart,
  onStop,
}) => {
  return (
    <View style={styles.container}>
      {!isSessionActive ? (
        <Button
          title="Start Session"
          onPress={onStart}
          disabled={isSessionActive}
        />
      ) : (
        <Button
          title="Stop Session"
          onPress={onStop}
          disabled={!isSessionActive}
          color="#ff0000"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
  },
});