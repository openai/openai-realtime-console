import { useState, useRef, useEffect, useCallback } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import {
  startRecording,
  stopRecording,
  stopAudioPlayback,
  playAudio,
} from "./useAudioService";
import _ from "lodash";
import { generateStarmoonAuthKey } from "@/app/actions";

export const useWebSocketHandler = (selectedUser: IUser) => {
  const [socketUrl, setSocketUrl] = useState<string | null>(null);
  const [personalityTranslationId, setPersonalityTranslationId] = useState<
    string | null
  >(null);
  const [messageHistory, setMessageHistory] = useState<MessageHistoryType[]>(
    []
  );
  const [connectionStatus, setConnectionStatus] = useState("Uninstantiated");
  const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(
    null
  );
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<{ audio: string; boundary: string | null }[]>(
    []
  );
  const [isMuted, setIsMuted] = useState(false);
  const isPlayingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const [emotionDictionary, setEmotionDictionary] = useState<{
    [key: string]: { scores: { [key: string]: number } };
  }>({});

  const connectionStartTimeRef = useRef<Date | null>(null);
  const connectionDurationRef = useRef<number | null>(null);

  const onOpenAuth = async (accessToken: string) => {
    sendJsonMessage({
      token: accessToken,
      device: "web",
      user_id: selectedUser.user_id,
      personality_translation_id: personalityTranslationId,
    });
    connectionStartTimeRef.current = new Date();
  };

  const onOpen = async () => {
    const accessToken = await generateStarmoonAuthKey(selectedUser);
    console.log("accessToken", accessToken);
    await onOpenAuth(accessToken);
    setConnectionStatus("Open");
    // startRecording(
    //   setMicrophoneStream,
    //   streamRef,
    //   audioContextRef,
    //   audioWorkletNodeRef,
    //   sendMessage
    // );
  };

  const { sendMessage, sendJsonMessage, lastMessage, readyState } =
    useWebSocket(socketUrl, {
      onOpen,
      onClose: async () => {
        // console.log("closed");
        setConnectionStatus("Closed");
        stopRecording(
          streamRef,
          setMicrophoneStream,
          audioWorkletNodeRef,
          audioContextRef,
          audioQueueRef,
          isPlayingRef
        );
        setMessageHistory([]);
      },
      onError: () => {
        // console.log("connection error");
        setConnectionStatus("Error");
        stopRecording(
          streamRef,
          setMicrophoneStream,
          audioWorkletNodeRef,
          audioContextRef,
          audioQueueRef,
          isPlayingRef
        );
      },
    });

  useEffect(() => {
    if (lastMessage && lastMessage.data) {
      const jsonData = JSON.parse(lastMessage.data) as LastJsonMessageType;
      console.log("lastMessage", jsonData);

      if (jsonData.type === "input" && jsonData.text_data) {
        setMessageHistory((prev) =>
          prev.concat({
            type: jsonData.type,
            text_data: jsonData.text_data,
            task_id: jsonData.task_id,
          })
        );
      }

      if (
        jsonData.type === "response" &&
        jsonData.audio_data &&
        jsonData.text_data
      ) {
        setMessageHistory((prev) =>
          prev.concat({
            type: jsonData.type,
            text_data: jsonData.text_data,
            task_id: jsonData.task_id,
          })
        );

        addToAudioQueue(jsonData.audio_data, jsonData.boundary);
      }

      if (
        jsonData.type === "response" &&
        !jsonData.audio_data &&
        jsonData.text_data
      ) {
        setMessageHistory((prev) =>
          prev.concat({
            type: jsonData.type,
            text_data: jsonData.text_data,
            task_id: jsonData.task_id,
          })
        );
      }

      if (
        jsonData.type === "response" &&
        jsonData.audio_data &&
        !jsonData.text_data
      ) {
        addToAudioQueue(jsonData.audio_data, jsonData.boundary);
      }

      if (jsonData.type === "info") {
        if (jsonData.text_data === "INTERRUPT") {
          stopAudioPlayback(
            setMicrophoneStream,
            streamRef,
            audioContextRef,
            audioWorkletNodeRef,
            sendMessage,
            audioQueueRef,
            isPlayingRef,
            setAudioBuffer
          );
        }
      }

      if (jsonData.type === "auth_success") {
        startRecording(
          setMicrophoneStream,
          streamRef,
          audioContextRef,
          audioWorkletNodeRef,
          sendMessage
        );
      }

      if (jsonData.type === "task") {
        let parsedData: any;
        if (typeof jsonData.text_data === "string") {
          parsedData = JSON.parse(jsonData.text_data);
        } else {
          parsedData = jsonData.text_data;
        }
        setEmotionDictionary((prev) => ({
          ...prev,
          [jsonData.task_id]: parsedData,
        }));
      }

      if (jsonData.type === "warning" && jsonData.text_data === "TIMEOUT") {
        setConnectionStatus("Closed");
        setSocketUrl(null);
        stopRecording(
          streamRef,
          setMicrophoneStream,
          audioWorkletNodeRef,
          audioContextRef,
          audioQueueRef,
          isPlayingRef
        );
      }

      if (jsonData.type === "credits_warning") {
        setConnectionStatus("Closed");
        setSocketUrl(null);
        stopRecording(
          streamRef,
          setMicrophoneStream,
          audioWorkletNodeRef,
          audioContextRef,
          audioQueueRef,
          isPlayingRef
        );
      }
    }
  }, [lastMessage]);

  // useEffect(() => {
  //   if (lastJsonMessage !== null) {
  //     if (typeof lastJsonMessage === "string") {
  //       const typedMessage = JSON.parse(lastJsonMessage) as LastJsonMessageType;

  //       if (typedMessage.type === "input" && typedMessage.text_data) {
  //         setMessageHistory((prev) =>
  //           prev.concat({
  //             type: typedMessage.type,
  //             text_data: typedMessage.text_data,
  //             task_id: typedMessage.task_id,
  //           })
  //         );
  //       }

  //       if (typedMessage.type === "response" && typedMessage.audio_data) {
  //         if (typedMessage.text_data) {
  //           setMessageHistory((prev) =>
  //             prev.concat({
  //               type: typedMessage.type,
  //               text_data: typedMessage.text_data,
  //               task_id: typedMessage.task_id,
  //             })
  //           );
  //         }
  //         addToAudioQueue(typedMessage.audio_data, typedMessage.boundary);
  //       }

  //       if (typedMessage.type === "task") {
  //         let parsedData: any;
  //         if (typeof typedMessage.text_data === "string") {
  //           parsedData = JSON.parse(typedMessage.text_data);
  //         } else {
  //           parsedData = typedMessage.text_data;
  //         }
  //         setEmotionDictionary((prev) => ({
  //           ...prev,
  //           [typedMessage.task_id]: parsedData,
  //         }));
  //       }

  //       if (
  //         typedMessage.type === "warning" &&
  //         typedMessage.text_data === "OFF"
  //       ) {
  //         // console.log("Connection closed by server");
  //         setConnectionStatus("Closed");
  //         setSocketUrl(null);
  //         stopRecording(
  //           streamRef,
  //           setMicrophoneStream,
  //           audioWorkletNodeRef,
  //           audioContextRef,
  //           audioQueueRef,
  //           isPlayingRef
  //         );
  //       }

  //       if (typedMessage.type === "credits_warning") {
  //         // console.log("Connection closed by server");
  //         setConnectionStatus("Closed");
  //         setSocketUrl(null);
  //         stopRecording(
  //           streamRef,
  //           setMicrophoneStream,
  //           audioWorkletNodeRef,
  //           audioContextRef,
  //           audioQueueRef,
  //           isPlayingRef
  //         );
  //       }

  //       // // console.log("text_data", typedMessage);
  //     }
  //   }
  // }, [lastJsonMessage]);

  const addToAudioQueue = (base64Audio: string, boundary: string | null) => {
    audioQueueRef.current.push({ audio: base64Audio, boundary });
    if (!isPlayingRef.current) {
      playNextInQueue();
    }
  };

  const playNextInQueue = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const nextAudio = audioQueueRef.current.shift();
    if (nextAudio) {
      await playAudio(nextAudio.audio, audioContextRef, setAudioBuffer);

      // Send JSON message based on the boundary
      if (nextAudio.boundary === "end") {
        const playbacTime = nextAudio.audio.length / 16000;
        // // console.log("playbackTime", playbacTime);
        // send sendJsonMessage after playbackTime
        setTimeout(() => {
          sendJsonMessage({ speaker: "user", is_replying: false });
        }, playbacTime);
      } else if (nextAudio.boundary === "start") {
        sendJsonMessage({ speaker: "user", is_replying: true });
      }

      playNextInQueue();
    }
  };

  const handleClickCloseConnection = useCallback(() => {
    sendJsonMessage({
      speaker: "user",
      is_replying: false,
      is_interrupted: false,
      is_ending: true,
    });
    setSocketUrl(null);
    stopRecording(
      streamRef,
      setMicrophoneStream,
      audioWorkletNodeRef,
      audioContextRef,
      audioQueueRef,
      isPlayingRef
    );
  }, []);

  const handleClickInterrupt = useCallback(() => {
    // ! If the above interrupt message is sent, the backend will stop sending the rest of the audio in the current round response a action to frontend to stop the audio playback - stopAudioPlayback
    sendJsonMessage({
      speaker: "user",
      is_replying: false,
      is_interrupted: true,
      is_ending: false,
    });
    // console.log("interrupted");
    stopAudioPlayback(
      setMicrophoneStream,
      streamRef,
      audioContextRef,
      audioWorkletNodeRef,
      sendMessage,
      audioQueueRef,
      isPlayingRef,
      setAudioBuffer
    );
  }, []);

  const handleClickOpenConnection = useCallback(
    (personalityTranslationId: string) => {
      const wsUrl =
        process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
          ? "wss://api.Humloop.app/live"
          : "ws://localhost:8000/live";
      // // console.log("opening ws connection", wsUrl);
      setSocketUrl(wsUrl);
      setPersonalityTranslationId(personalityTranslationId); // setSocketUrl("wss://api.Humloop.app/Humloop");
    },
    []
  );

  useEffect(() => {
    const status = {
      [ReadyState.CONNECTING]: "Connecting",
      [ReadyState.OPEN]: "Open",
      [ReadyState.CLOSING]: "Closing",
      [ReadyState.CLOSED]: "Closed",
      [ReadyState.UNINSTANTIATED]: "Uninstantiated",
    }[readyState];

    setConnectionStatus(status);
  }, [readyState]);

  const muteMicrophone = () => {
    if (microphoneStream) {
      microphoneStream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      setIsMuted(true);
    }
  };

  const unmuteMicrophone = () => {
    if (microphoneStream) {
      microphoneStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      setIsMuted(false);
    }
  };

  return {
    socketUrl,
    setSocketUrl,
    messageHistory,
    emotionDictionary,
    connectionStatus,
    microphoneStream,
    audioBuffer,
    handleClickOpenConnection,
    handleClickInterrupt,
    handleClickCloseConnection,
    muteMicrophone,
    unmuteMicrophone,
    isMuted,
    connectionDuration: connectionDurationRef.current || null,
  };
};
