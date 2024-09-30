/**
 * Basic utilities for the RealtimeAPI
 * @class
 */
export class RealtimeUtils {
    /**
     * Converts Float32Array of amplitude data to ArrayBuffer in Int16Array format
     * @param {Float32Array} float32Array
     * @returns {ArrayBuffer}
     */
    static floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer;
    /**
     * Converts a base64 string to an ArrayBuffer
     * @param {string} base64
     * @returns {ArrayBuffer}
     */
    static base64ToArrayBuffer(base64: string): ArrayBuffer;
    /**
     * Converts an ArrayBuffer, Int16Array or Float32Array to a base64 string
     * @param {ArrayBuffer|Int16Array|Float32Array} arrayBuffer
     * @returns {string}
     */
    static arrayBufferToBase64(arrayBuffer: ArrayBuffer | Int16Array | Float32Array): string;
    /**
     * Merge two Int16Arrays from Int16Arrays or ArrayBuffers
     * @param {ArrayBuffer|Int16Array} left
     * @param {ArrayBuffer|Int16Array} right
     * @returns {Int16Array}
     */
    static mergeInt16Arrays(left: ArrayBuffer | Int16Array, right: ArrayBuffer | Int16Array): Int16Array;
    /**
     * Generates an id to send with events and messages
     * @param {string} prefix
     * @param {number} [length]
     * @returns {string}
     */
    static generateId(prefix: string, length?: number): string;
}
//# sourceMappingURL=utils.d.ts.map