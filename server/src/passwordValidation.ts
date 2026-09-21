import crypto from 'crypto';

/**
 * Server-side Password Validation & Hashing
 * Quy tắc đặt pass:
 * - Tối thiểu 8 ký tự
 * - Có chữ in hoa
 * - Có chữ in thường
 * - Có ký tự đặc biệt
 */

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).{8,}$/;

export function validatePassword(password: string): { isValid: boolean; errorMessage?: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, errorMessage: 'Vui lòng nhập mật khẩu.' };
  }

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

  const isValid = hasMinLength && hasUppercase && hasLowercase && hasSpecialChar;

  if (!isValid) {
    const missing: string[] = [];
    if (!hasMinLength) missing.push('tối thiểu 8 ký tự');
    if (!hasUppercase) missing.push('chữ in hoa');
    if (!hasLowercase) missing.push('chữ in thường');
    if (!hasSpecialChar) missing.push('ký tự đặc biệt (ví dụ: @, #, $, !)');
    return {
      isValid: false,
      errorMessage: `Mật khẩu phải có ${missing.join(', ')}.`
    };
  }

  return { isValid: true };
}

/**
 * Hashes a plaintext password using crypto.scrypt (Salt + Derived Key).
 * Format output: salt:derivedKeyHex
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Synchronous variant of scrypt password hashing.
 */
export function hashPasswordSync(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a plaintext password against a stored scrypt hash using crypto.timingSafeEqual.
 * Protects against timing attacks.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash || typeof storedHash !== 'string') return false;

  // Support scrypt hash in format "salt:derivedKeyHex"
  if (storedHash.includes(':')) {
    const [salt, keyHex] = storedHash.split(':');
    if (!salt || !keyHex) return false;

    return new Promise((resolve) => {
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) return resolve(false);
        try {
          const keyBuffer = Buffer.from(keyHex, 'hex');
          if (keyBuffer.length !== derivedKey.length) {
            return resolve(false);
          }
          const match = crypto.timingSafeEqual(keyBuffer, derivedKey);
          resolve(match);
        } catch {
          resolve(false);
        }
      });
    });
  }

  // Fallback for legacy plaintext password comparison with timingSafeEqual
  try {
    const a = Buffer.from(password);
    const b = Buffer.from(storedHash);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return password === storedHash;
  }
}

