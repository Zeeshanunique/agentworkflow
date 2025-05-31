import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

// Constants
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16 bytes
const AUTH_TAG_LENGTH = 16;
const ENCRYPTION_KEY_LENGTH = 32; // 256 bits

/**
 * Encryption service for credential data
 * Uses AES-256-GCM for secure credential encryption
 */
export class EncryptionService {
  private encryptionKey: Buffer;

  constructor() {
    this.encryptionKey = this.getEncryptionKey();
  }

  /**
   * Get the encryption key from environment or generate/load from file
   */
  private getEncryptionKey(): Buffer {
    // First check if key is provided in environment
    if (env.ENCRYPTION_KEY) {
      const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
      if (key.length !== ENCRYPTION_KEY_LENGTH) {
        throw new Error(`Encryption key must be ${ENCRYPTION_KEY_LENGTH * 8} bits (${ENCRYPTION_KEY_LENGTH} bytes).`);
      }
      return key;
    }

    // Otherwise check for key file
    const keyFilePath = path.join(process.cwd(), '.n8n', 'encryption_key');
    
    try {
      if (fs.existsSync(keyFilePath)) {
        // Load existing key
        const key = Buffer.from(fs.readFileSync(keyFilePath, 'utf8'), 'hex');
        if (key.length !== ENCRYPTION_KEY_LENGTH) {
          throw new Error('Invalid encryption key in key file.');
        }
        return key;
      } else {
        // Generate new key
        const key = crypto.randomBytes(ENCRYPTION_KEY_LENGTH);
        
        // Ensure directory exists
        const dir = path.dirname(keyFilePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Save key to file
        fs.writeFileSync(keyFilePath, key.toString('hex'), { mode: 0o600 }); // Restrictive permissions
        return key;
      }
    } catch (error) {
      console.error('Error accessing encryption key file:', error);
      throw new Error('Failed to access or create encryption key file.');
    }
  }

  /**
   * Encrypt data with AES-256-GCM
   * @param data - Data to encrypt (as string)
   * @returns Encrypted data with IV and auth tag prepended
   */
  encrypt(data: string): string {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher with key, iv
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the auth tag
    const authTag = cipher.getAuthTag();
    
    // Combine everything: IV + Auth Tag + Encrypted Data
    // Format: <iv (hex)>:<auth tag (hex)>:<encrypted data (hex)>
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt data with AES-256-GCM
   * @param encryptedData - Data encrypted with encrypt()
   * @returns Original decrypted string
   */
  decrypt(encryptedData: string): string {
    // Split the string to get IV, auth tag and encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();
