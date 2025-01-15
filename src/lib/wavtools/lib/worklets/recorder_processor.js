class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bytesRecorded = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const inputChannel = input[0];

    // Convert to Int16 directly in the worklet
    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer[this.bytesRecorded++] = inputChannel[i];

      if (this.bytesRecorded >= this.bufferSize) {
        // Convert to Int16
        const int16Data = new Int16Array(this.bufferSize);
        for (let j = 0; j < this.bufferSize; j++) {
          int16Data[j] = Math.max(
            -32768,
            Math.min(32767, this.buffer[j] * 32768),
          );
        }

        this.port.postMessage(
          {
            type: "data",
            audio: int16Data.buffer,
          },
          [int16Data.buffer],
        );

        this.bytesRecorded = 0;
      }
    }
    return true;
  }
}

registerProcessor("recorder-processor", RecorderProcessor);
