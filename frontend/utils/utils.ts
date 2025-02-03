import { redirect } from "next/navigation";
// import crypto from 'crypto';

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string,
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}


// /**
//  * Encrypts a plaintext secret (e.g. API key) with a master encryption key.
//  * @param secret - The plaintext secret to encrypt.
//  * @param masterKey - 32-byte string or buffer for AES-256 (e.g. from process.env.ENCRYPTION_KEY).
//  * @returns { iv: string, encryptedData: string }
//  */
// export function encryptSecret(secret: string, masterKey: string) {
//   // For AES-256, masterKey must be 32 bytes.
//   if (masterKey.length !== 32) {
//     throw new Error('ENCRYPTION_KEY must be 32 bytes for AES-256.');
//   }

//   // Generate a random IV
//   const iv = crypto.randomBytes(16);

//   // Create cipher
//   const cipher = crypto.createCipheriv(
//     'aes-256-cbc' as crypto.CipherGCMTypes,
//     new TextEncoder().encode(masterKey) as crypto.CipherKey,
//     iv as crypto.BinaryLike
//   );

//   let encrypted = cipher.update(secret, 'utf8', 'base64');
//   encrypted += cipher.final('base64');

//   return {
//     iv: iv.toString('base64'),
//     encryptedData: encrypted,
//   };
// }

// /**
//  * Decrypts an encrypted secret with the same master encryption key.
//  * @param encryptedData - base64 string from the database
//  * @param iv - base64 IV from the database
//  * @param masterKey - 32-byte string or buffer
//  * @returns the original plaintext secret
//  */
// export function decryptSecret(encryptedData: string, iv: string, masterKey: string) {
//   if (masterKey.length !== 32) {
//     throw new Error('ENCRYPTION_KEY must be 32 bytes for AES-256.');
//   }

//   const decipher = crypto.createDecipheriv(
//     'aes-256-cbc',
//     Buffer.from(masterKey),
//     Buffer.from(iv, 'base64')
//   );

//   let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
//   decrypted += decipher.final('utf8');
//   return decrypted;
// }