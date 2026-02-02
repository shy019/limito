// Client-side hashing utility using Web Crypto API
export async function hashSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// For sensitive data that needs to be recoverable (like phone numbers)
// We use a simple encoding - the real protection is HTTPS + server-side encryption
export async function encryptForTransit(text: string): Promise<string> {
  const key = Date.now().toString(36);
  const encoded = btoa(unescape(encodeURIComponent(text)));
  const mixed = encoded.split('').map((char, i) => 
    String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join('');
  return `${key}:${btoa(mixed)}`;
}

export function decryptFromTransit(encrypted: string): string {
  try {
    const [key, data] = encrypted.split(':');
    const mixed = atob(data);
    const encoded = mixed.split('').map((char, i) =>
      String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join('');
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    return encrypted;
  }
}
