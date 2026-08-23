import { validateUsername as validateUsernameFn } from './usernameValidator.js';

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  return null;
};

export const validatePassword = (password) => {
  if (password.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  return null;
};

export const validateUsername = (username) => {
  const result = validateUsernameFn(username);
  if (!result.isValid) {
    return result.message;
  }
  return null;
};

// --- @handle (unique username) validation ---

const USERNAME_HANDLE_REGEX = /^[a-z0-9_]{3,20}$/;

export const normalizeUsernameHandle = (handle) => {
  if (typeof handle !== 'string') return '';
  return handle.trim().replace(/^@+/, '').toLowerCase();
};

export const validateUsernameHandle = (handle) => {
  const normalized = normalizeUsernameHandle(handle);

  if (!normalized) {
    return 'Username is required';
  }
  if (normalized.length < 3) {
    return 'Username must be at least 3 characters long';
  }
  if (normalized.length > 20) {
    return 'Username cannot exceed 20 characters';
  }
  if (!USERNAME_HANDLE_REGEX.test(normalized)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  return null;
};