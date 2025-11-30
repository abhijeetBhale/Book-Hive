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