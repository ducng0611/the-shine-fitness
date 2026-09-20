/**
 * Quy chuẩn mật khẩu bảo mật hệ thống The Shine Fitness & Yoga
 * Yêu cầu:
 * - Tối thiểu 8 ký tự
 * - Có ít nhất 1 chữ in hoa (A-Z)
 * - Có ít nhất 1 chữ in thường (a-z)
 * - Có ít nhất 1 ký tự đặc biệt (!@#$%^&*()_+-=[]{};':"|,.<>/?~`)
 */

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).{8,}$/;

export interface PasswordValidationResult {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasSpecialChar: boolean;
  errorMessage?: string;
}

export function validatePassword(password: string): PasswordValidationResult {
  const hasMinLength = typeof password === 'string' && password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password || '');
  const hasLowercase = /[a-z]/.test(password || '');
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password || '');

  const isValid = hasMinLength && hasUppercase && hasLowercase && hasSpecialChar;

  let errorMessage: string | undefined;
  if (!isValid) {
    const missing: string[] = [];
    if (!hasMinLength) missing.push('tối thiểu 8 ký tự');
    if (!hasUppercase) missing.push('ít nhất 1 chữ in hoa');
    if (!hasLowercase) missing.push('ít nhất 1 chữ in thường');
    if (!hasSpecialChar) missing.push('ít nhất 1 ký tự đặc biệt (ví dụ: @, #, $, %, !)');
    errorMessage = `Mật khẩu chưa đạt chuẩn: cần ${missing.join(', ')}.`;
  }

  return {
    isValid,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasSpecialChar,
    errorMessage
  };
}
