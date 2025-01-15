import { WavPacker } from "../lib/wavtools/index.js";

export function arrayBufferToBase64(
  arrayBuffer: ArrayBuffer | Float32Array | Int16Array
): string {
  if (arrayBuffer instanceof Float32Array) {
    arrayBuffer = WavPacker.floatTo16BitPCM(arrayBuffer);
  } else if (arrayBuffer instanceof Int16Array) {
    arrayBuffer = arrayBuffer.buffer;
  }
  let binary = "";
  let bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000; // 32KB chunk size
  for (let i = 0; i < bytes.length; i += chunkSize) {
    let chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}
