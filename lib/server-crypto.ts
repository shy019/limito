// Server-side decryption for data encrypted with client-crypto
export function decryptFromTransit(encrypted: string): string {
  try {
    if (!encrypted.includes(':')) return encrypted;
    const [key, data] = encrypted.split(':');
    const mixed = Buffer.from(data, 'base64').toString('binary');
    const encoded = mixed.split('').map((char, i) =>
      String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join('');
    return Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    return encrypted;
  }
}
