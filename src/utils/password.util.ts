import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Configuration for password hashing
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

/**
 * Securely hash a password using scrypt (matching Medusa's approach)
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password in base64 format
 */
export const hashPassword = async (password: string): Promise<string> => {
  if (!password || password.trim().length === 0)
    throw new Error('Password cannot be empty');

  const salt = randomBytes(SALT_LENGTH);
  const key = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt.toString('base64')}:${key.toString('base64')}`;
};

/**
 * Verify a password against its hash
 * @param password - Plain text password
 * @param hash - Hashed password in base64 format
 * @returns Promise<boolean> - Whether password matches
 */
export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  if (!password || !hash) return false;

  try {
    const [saltBase64, keyBase64] = hash.split(':');
    if (!saltBase64 || !keyBase64) return false;

    const salt = Buffer.from(saltBase64, 'base64');
    const storedKey = Buffer.from(keyBase64, 'base64');
    const derivedKey = (await scryptAsync(
      password,
      salt,
      KEY_LENGTH
    )) as Buffer;

    return storedKey.equals(derivedKey);
  } catch (error) {
    return false;
  }
};
