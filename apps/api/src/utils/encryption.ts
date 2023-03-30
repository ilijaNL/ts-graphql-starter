import crypto from 'crypto';

const ENCRYPTION_KEY: string = process.env.SC_ENCRYPTION_KEY || ''; // Must be 256 bits (32 characters)
const IV_LENGTH: number = 16; // For AES, this is always 16

export function encrypt(text: string, encryptionKey: string = ENCRYPTION_KEY): string {
  let iv = Buffer.from(crypto.randomBytes(IV_LENGTH)).toString('hex').slice(0, IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
  let encrypted = cipher.update(text);

  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv + ':' + encrypted.toString('hex');
}

export function decrypt(text: string, encryptionKey: string = ENCRYPTION_KEY): string {
  let textParts: string[] = text.includes(':') ? text.split(':') : [];
  let iv = Buffer.from(textParts.shift() || '', 'binary');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
  let decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
