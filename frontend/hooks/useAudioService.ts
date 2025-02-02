export const startRecording = async (
  setMicrophoneStream: React.Dispatch<React.SetStateAction<MediaStream | null>>,
  streamRef: React.MutableRefObject<MediaStream | null>,
  audioContextRef: React.MutableRefObject<AudioContext | null>,
  audioWorkletNodeRef: React.MutableRefObject<AudioWorkletNode | null>,
  sendMessage: (message: any) => void
) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    streamRef.current = stream;
    setMicrophoneStream(stream);

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
    }

    const audioContext = audioContextRef.current;
    await audioContext.audioWorklet.addModule("/audioProcessor.js");

    const mediaStreamSource = audioContext.createMediaStreamSource(stream);
    const audioWorkletNode = new AudioWorkletNode(
      audioContext,
      "audio-processor"
    );

    audioWorkletNodeRef.current = audioWorkletNode;

    audioWorkletNode.port.onmessage = (event) => {
      const inputData = event.data;

      // Convert float32 to int16
      const int16Array = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        // Scale the float32 value to the range of int16
        const scaledValue = inputData[i] * 32768;
        // Clamp the value to be within the int16 range
        int16Array[i] = Math.max(
          -32768,
          Math.min(32767, Math.round(scaledValue))
        );
      }
      // Send the raw PCM data
      sendMessage(int16Array);
    };

    mediaStreamSource.connect(audioWorkletNode);
  } catch (err) {
    console.error("Error accessing microphone", err);
  }
};

export const stopRecording = (
  streamRef: React.MutableRefObject<MediaStream | null>,
  setMicrophoneStream: React.Dispatch<React.SetStateAction<MediaStream | null>>,
  audioWorkletNodeRef: React.MutableRefObject<AudioWorkletNode | null>,
  audioContextRef: React.MutableRefObject<AudioContext | null>,
  audioQueueRef: React.MutableRefObject<
    { audio: string; boundary: string | null }[]
  >,
  isPlayingRef: React.MutableRefObject<boolean>
) => {
  if (streamRef.current) {
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setMicrophoneStream(null);
  }

  if (audioWorkletNodeRef.current) {
    audioWorkletNodeRef.current.disconnect();
    audioWorkletNodeRef.current = null;
  }

  if (audioContextRef.current) {
    audioContextRef.current.close();
    audioContextRef.current = null;
  }

  // Clear unplayed audio
  audioQueueRef.current = [];
  isPlayingRef.current = false;
};

export const stopAudioPlayback = async (
  setMicrophoneStream: React.Dispatch<React.SetStateAction<MediaStream | null>>,
  streamRef: React.MutableRefObject<MediaStream | null>,
  audioContextRef: React.MutableRefObject<AudioContext | null>,
  audioWorkletNodeRef: React.MutableRefObject<AudioWorkletNode | null>,
  sendMessage: (message: any) => void,
  audioQueueRef: React.MutableRefObject<
    { audio: string; boundary: string | null }[]
  >,
  isPlayingRef: React.MutableRefObject<boolean>,
  setAudioBuffer: React.Dispatch<React.SetStateAction<AudioBuffer | null>>
) => {
  // Stop any ongoing playback and clear the audio buffer
  if (audioContextRef.current) {
    if (audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
  }
  setAudioBuffer(null);

  // Clear any queued audio
  audioQueueRef.current = [];
  isPlayingRef.current = false;

  // Stop any ongoing recording
  stopRecording(
    streamRef,
    setMicrophoneStream,
    audioWorkletNodeRef,
    audioContextRef,
    audioQueueRef,
    isPlayingRef
  );

  // Start recording again
  await startRecording(
    setMicrophoneStream,
    streamRef,
    audioContextRef,
    audioWorkletNodeRef,
    sendMessage
  );
};

const base64ToFloat32Array = (
  base64: string,
  isLittleEndian: boolean,
  isSigned: boolean
): Float32Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const buffer = new ArrayBuffer(len);
  const view = new Uint8Array(buffer);

  for (let i = 0; i < len; i++) {
    view[i] = binaryString.charCodeAt(i);
  }

  const dataView = new DataView(buffer);
  const length = len / 2; // Assuming 16-bit PCM
  const floatArray = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    let sample: number;

    if (isSigned) {
      // Read 16-bit signed integer
      sample = dataView.getInt16(i * 2, isLittleEndian);
    } else {
      // Read 16-bit unsigned integer and convert to signed
      sample = dataView.getUint16(i * 2, isLittleEndian) - 32768;
    }

    // Normalize the sample to -1.0 to 1.0
    floatArray[i] = sample / 32768;
  }

  return floatArray;
};

export const playAudio = async (
  base64Audio: string,
  audioContextRef: React.MutableRefObject<AudioContext | null>,
  setAudioBuffer: React.Dispatch<React.SetStateAction<AudioBuffer | null>>,
  isLittleEndian = true, // Set to false if data is big-endian
  isSigned = true, // Set to false if data is unsigned
  sampleRate = 16000, // Adjust to your actual sample rate
  numChannels = 1 // Adjust to your actual number of channels
): Promise<void> => {
  if (!audioContextRef.current) {
    audioContextRef.current = new AudioContext();
  }

  const audioContext = audioContextRef.current;

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  try {
    const pcmData = base64ToFloat32Array(base64Audio, isLittleEndian, isSigned);
    const frameCount = pcmData.length / numChannels;
    const audioBuffer = audioContext.createBuffer(
      numChannels, // Number of channels
      frameCount, // Length per channel
      sampleRate // Sample rate
    );

    // Split the pcmData into channel data if necessary
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = pcmData[i * numChannels + channel];
      }
    }

    setAudioBuffer(audioBuffer);

    return new Promise((resolve) => {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => resolve();
      source.start();
    });
  } catch (error) {
    console.error("Error creating audio buffer", error);
  }
};

// // Globals or component-level refs to store queued data
// let audioQueue: Float32Array[] = [];
// let totalSamples = 0;
// let isPlaying = false;

// export const playAudio = async (
//   base64Audio: string,
//   audioContextRef: React.MutableRefObject<AudioContext | null>,
//   setAudioBuffer: React.Dispatch<React.SetStateAction<AudioBuffer | null>>,
//   isLittleEndian = true, // Adjust if your data endianness differs
//   isSigned = true, // Adjust if your data is unsigned 16-bit
//   sampleRate = 16000, // Adjust to the actual sample rate of your audio
//   numChannels = 1, // Adjust to the actual number of channels
//   bufferThresholdSeconds = 0 // How many seconds to buffer before starting playback
// ): Promise<void> => {
//   if (!audioContextRef.current) {
//     audioContextRef.current = new AudioContext();
//   }

//   const audioContext = audioContextRef.current;

//   // Ensure the AudioContext is running
//   if (audioContext.state === "suspended") {
//     await audioContext.resume();
//   }

//   // Decode incoming chunk
//   const pcmData = base64ToFloat32Array(base64Audio, isLittleEndian, isSigned);

//   // Add new data to queue
//   audioQueue.push(pcmData);
//   totalSamples += pcmData.length;

//   // Calculate how many seconds of audio we have
//   const totalTime = totalSamples / sampleRate;

//   // If we're not currently playing and we have enough buffered data, start playback
//   if (!isPlaying && totalTime >= bufferThresholdSeconds) {
//     isPlaying = true;

//     // Combine all queued PCM data
//     const combined = new Float32Array(totalSamples);
//     let offset = 0;
//     for (const chunk of audioQueue) {
//       combined.set(chunk, offset);
//       offset += chunk.length;
//     }

//     // Clear the queue since we've combined it
//     audioQueue = [];

//     // Create an AudioBuffer from the combined data
//     const audioBuffer = audioContext.createBuffer(
//       numChannels,
//       combined.length,
//       sampleRate
//     );
//     for (let channel = 0; channel < numChannels; channel++) {
//       audioBuffer.copyToChannel(combined, channel);
//     }

//     // Store the buffer in state if desired (e.g., for visualization)
//     setAudioBuffer(audioBuffer);

//     return new Promise((resolve) => {
//       const source = audioContext.createBufferSource();
//       source.buffer = audioBuffer;
//       source.connect(audioContext.destination);
//       source.onended = () => {
//         isPlaying = false;
//         totalSamples = 0; // Reset sample count after playback
//         resolve();
//       };
//       source.start();
//     });
//   }
// };
