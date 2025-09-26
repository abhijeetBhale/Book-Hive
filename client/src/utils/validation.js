import { VALIDATION_RULES } from './constants'

export const validateEmail = (email) => {
  if (!email) return 'Email is required'
  if (!VALIDATION_RULES.email.pattern.test(email)) {
    return 'Please enter a valid email address'
  }
  return null
}

export const validatePassword = (password) => {
  if (!password) return 'Password is required'
  if (password.length < VALIDATION_RULES.password.minLength) {
    return `Password must be at least ${VALIDATION_RULES.password.minLength} characters long`
  }
  if (!VALIDATION_RULES.password.pattern.test(password)) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  }
  return null
}

export const validateRequired = (value, fieldName) => {
  if (!value || value.toString().trim() === '') {
    return `${fieldName} is required`
  }
  return null
}

export const validateBookForm = (data) => {
  const errors = {}
  
  if (!data.title?.trim()) errors.title = 'Title is required'
  if (!data.author?.trim()) errors.author = 'Author is required'
  if (!data.category) errors.category = 'Category is required'
  if (!data.description?.trim()) errors.description = 'Description is required'
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateLocationData = (lat, lng) => {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return 'Invalid location coordinates'
  }
  if (lat < -90 || lat > 90) {
    return 'Latitude must be between -90 and 90'
  }
  if (lng < -180 || lng > 180) {
    return 'Longitude must be between -180 and 180'
  }
  return null
}
