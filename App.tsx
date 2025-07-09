import React, { useState, useRef, useEffect } from 'react';
import { Button, SafeAreaView, StyleSheet, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import {
  mediaDevices,
  RTCPeerConnection,
  MediaStream,
  RTCView,
} from 'react-native-webrtc-web-shim';
import { clientTools, clientToolsSchema } from './utils/tools';
import Constants from 'expo-constants';

import * as Brightness from 'expo-brightness';

const App = () => {
  useEffect(() => {
    (async () => {
      const { status } = await Brightness.requestPermissionsAsync();
      console.log('brightness status', status);
      // if (status === 'granted') {
      //   Brightness.setSystemBrightnessAsync(0);
      // }
    })();
  }, []);

  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [transcript, setTranscript] = useState('');
  const [dataChannel, setDataChannel] = useState<null | ReturnType<
    RTCPeerConnection['createDataChannel']
  >>(null);
  const peerConnection = useRef<null | RTCPeerConnection>(null);
  const [localMediaStream, setLocalMediaStream] = useState<null | MediaStream>(
    null
  );
  const remoteMediaStream = useRef<MediaStream>(new MediaStream());
  const isVoiceOnly = true;

  async function startSession() {
    // Get the OpenAI API key from environment variable
    const OPENAI_API_KEY = Constants.expoConfig?.extra?.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not found. Please set OPENAI_API_KEY in your app.config.js or app.json extra field');
    }

    // Enable audio and force speaker output
    await Audio.setAudioModeAsync({ 
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      allowsRecordingIOS: true,
      interruptionModeIOS: 1, // InterruptionModeIOS.DoNotMix
      interruptionModeAndroid: 1, // InterruptionModeAndroid.DoNotMix
    });

    // Create a peer connection
    const pc = new RTCPeerConnection();
    // Set up some event listeners
    pc.addEventListener('connectionstatechange', (e) => {
      console.log('connectionstatechange', e);
    });
    pc.addEventListener('track', (event) => {
      if (event.track) remoteMediaStream.current.addTrack(event.track);
    });

    // Add local audio track for microphone input in the browser
    const ms = await mediaDevices.getUserMedia({
      audio: true,
    });
    if (isVoiceOnly) {
      let videoTrack = await ms.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = false;
    }

    setLocalMediaStream(ms);
    pc.addTrack(ms.getTracks()[0]);

    // Set up data channel for sending and receiving events
    const dc = pc.createDataChannel('oai-events');
    setDataChannel(dc);

    // Start the session using the Session Description Protocol (SDP)
    const offer = await pc.createOffer({});
    await pc.setLocalDescription(offer);

    const baseUrl = 'https://api.openai.com/v1/realtime';
    const model = 'gpt-4o-realtime-preview-2024-12-17';
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: 'POST',
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/sdp',
      },
    });

    const answer = {
      type: 'answer',
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);

    peerConnection.current = pc;
  }

  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }

  // Attach event listeners to the data channel when a new one is created
  useEffect(() => {
    function configureTools() {
      console.log('Configuring the client side tools');
      const event = {
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions:
            'You are a helpful assistant. You have access to certain tools that allow you to check the user device battery level and change the display brightness. Use these tolls if the user asks about them. Otherwise, just answer the question.',
          // Provide the tools. Note they match the keys in the `clientTools` object above.
          tools: clientToolsSchema,
        },
      };
      dataChannel.send(JSON.stringify(event));
    }

    if (dataChannel) {
      // Append new server events to the list
      // TODO: load types from OpenAI SDK.
      dataChannel.addEventListener('message', async (e: any) => {
        const data = JSON.parse(e.data);
        console.log('dataChannel message', data);
        setEvents((prev) => [data, ...prev]);
        // Get transcript.
        if (data.type === 'response.audio_transcript.done') {
          setTranscript(data.transcript);
        }
        // Handle function calls
        if (data.type === 'response.function_call_arguments.done') {
          // TODO: improve types.
          const functionName: keyof typeof clientTools = data.name;
          const tool: any = clientTools[functionName];
          if (tool !== undefined) {
            console.log(
              `Calling local function ${data.name} with ${data.arguments}`
            );
            const args = JSON.parse(data.arguments);
            const result = await tool(args);
            console.log('result', result);
            // Let OpenAI know that the function has been called and share it's output
            const event = {
              type: 'conversation.item.create',
              item: {
                type: 'function_call_output',
                call_id: data.call_id, // call_id from the function_call message
                output: JSON.stringify(result), // result of the function
              },
            };
            dataChannel.send(JSON.stringify(event));
            // Force a response to the user
            dataChannel.send(
              JSON.stringify({
                type: 'response.create',
              })
            );
          }
        }
      });

      // Set session active when the data channel is opened
      dataChannel.addEventListener('open', () => {
        setIsSessionActive(true);
        setEvents([]);
        // Configure the client side tools
        configureTools();
      });
    }
  }, [dataChannel]);

  return (
    <>
      <StatusBar style="auto" />
      <SafeAreaView style={styles.container}>
        <View>
          {!isSessionActive ? (
            <Button
              title="Start"
              onPress={startSession}
              disabled={isSessionActive}
            />
          ) : (
            <Button
              title="Stop"
              onPress={stopSession}
              disabled={!isSessionActive}
            />
          )}
          <RTCView stream={remoteMediaStream.current} />
        </View>
        <Text style={styles.text}>{transcript}</Text>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  text: { textAlign: 'center', fontSize: 88 },
});

export default App;
