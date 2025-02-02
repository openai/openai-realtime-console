class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (input.length > 0) {
      const inputData = input[0];

      // Post the audio data to the main thread
      this.port.postMessage(inputData);
    }

    // Return true to keep the processor alive
    return true;
  }
}

registerProcessor("audio-processor", AudioProcessor);
