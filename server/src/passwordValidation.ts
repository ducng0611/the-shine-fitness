/**
 * Server-side Password Validation
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
