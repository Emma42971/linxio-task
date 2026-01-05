import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService implements OnModuleInit {
  private readonly logger = new Logger(CryptoService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey: Buffer;

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-for-development-only';
    // scryptSync returns a Buffer, not a string
    this.secretKey = crypto.scryptSync(encryptionKey, 'salt', 32);
  }

  onModuleInit() {
    // Block startup in production if ENCRYPTION_KEY is not set
    if (process.env.NODE_ENV === 'production' && !process.env.ENCRYPTION_KEY) {
      this.logger.error(
        'ENCRYPTION_KEY is required in production environment. Application cannot start without it.',
      );
      throw new Error(
        'ENCRYPTION_KEY environment variable is required in production. Please set a secure 64-character hex encryption key.',
      );
    }

    if (!process.env.ENCRYPTION_KEY) {
      this.logger.warn(
        'ENCRYPTION_KEY not found in environment variables. Using default key. Set ENCRYPTION_KEY for production.',
      );
    } else if (process.env.ENCRYPTION_KEY.length < 32) {
      this.logger.warn(
        'ENCRYPTION_KEY is too short. Recommended length is at least 64 characters for production use.',
      );
    }
  }

  encrypt(text: string): string {
    if (!text) return text;

    try {
      // Use 12-byte IV for GCM mode (recommended)
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      this.logger.error('Encryption failed', error instanceof Error ? error.stack : String(error));
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;

    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
      }

      const [ivHex, authTagHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error instanceof Error ? error.stack : String(error));
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  encryptJson(obj: any): string | null {
    if (!obj) return null;
    return this.encrypt(JSON.stringify(obj));
  }

  decryptJson<T = any>(encryptedText: string): T | null {
    if (!encryptedText) return null;
    const decrypted = this.decrypt(encryptedText);
    return JSON.parse(decrypted) as T;
  }

  generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}
