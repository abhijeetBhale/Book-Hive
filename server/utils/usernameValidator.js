import { ALL_BANNED_WORDS, CHAR_SUBSTITUTIONS } from './bannedWords.js';

/**
 * Normalize username by removing special characters, numbers, and converting to lowercase
 * This helps detect variations like "B#Ho$D!Ke" -> "bhosadike"
 */
const normalizeUsername = (username) => {
  if (!username) return '';
  
  let normalized = username.toLowerCase().trim();
  
  // Replace common character substitutions (do this multiple times to catch all variations)
  for (let i = 0; i < 2; i++) {
    Object.entries(CHAR_SUBSTITUTIONS).forEach(([char, replacement]) => {
      normalized = normalized.split(char).join(replacement);
    });
  }
  
  // Remove all remaining special characters, spaces, and numbers
  normalized = normalized.replace(/[^a-z]/g, '');
  
  return normalized;
};

/**
 * Check if username contains any banned words
 * Returns the first banned word found, or null if clean
 */
const containsBannedWord = (username) => {
  const normalized = normalizeUsername(username);
  
  // List of short words that should only match as exact matches to avoid false positives
  // These are common English words that might appear in legitimate usernames
  const shortWordExceptions = ['fag', 'die', 'cum', 'gay', 'ass', 'tit', 'ceo', 'coo'];
  
  // Check exact matches and partial matches
  for (const bannedWord of ALL_BANNED_WORDS) {
    const normalizedBanned = normalizeUsername(bannedWord);
    
    // Skip single character matches (too many false positives)
    if (normalizedBanned.length <= 1) {
      continue;
    }
    
    // Handle short words (2-3 chars) carefully
    if (normalizedBanned.length <= 3) {
      // Check if this short word is in the exception list
      if (shortWordExceptions.includes(normalizedBanned)) {
        // Only match if it's the entire username (exact match)
        if (normalized === normalizedBanned) {
          return bannedWord;
        }
        continue;
      }
      
      // For other short words (like "xxx", "fck", "mc", "bc"), match if present
      if (normalized.includes(normalizedBanned)) {
        return bannedWord;
      }
      continue;
    }
    
    // Check if banned word is contained in username (for words 4+ chars)
    if (normalized.includes(normalizedBanned)) {
      return bannedWord;
    }
    
    // Check if username is contained in banned word (for longer variations)
    if (normalizedBanned.includes(normalized) && normalized.length >= 4) {
      return bannedWord;
    }
  }
  
  return null;
};

/**
 * Check for phonetic variations of Hindi words
 * Handles cases like: chutiya, chutya, chutiye, chutiyah
 */
const checkPhoneticVariations = (username) => {
  const normalized = normalizeUsername(username);
  
  // Common phonetic patterns in Hindi/Hinglish
  const phoneticPatterns = [
    // Variations of common endings
    { pattern: /chut(iya|ya|iye|yaa|yah|ye|i|y)/, word: 'chutiya' },
    { pattern: /madarch(od|od|odd|ood)/, word: 'madarchod' },
    { pattern: /bh(e|a)nch(od|od|odd)/, word: 'behenchod' },
    { pattern: /bhos(d|ad)(ike|ik|i|ke|k|a)/, word: 'bhosdike' },
    { pattern: /gand(u|uu|oo|o)/, word: 'gandu' },
    { pattern: /l(u|o|au|aw)(nd|d|da|dh)/, word: 'lund' },
    { pattern: /rand(i|ii|y|e)/, word: 'randi' },
    { pattern: /haram(i|ii|zada|zadi)/, word: 'harami' },
    { pattern: /kamin(a|e|ey|i)/, word: 'kameena' },
    { pattern: /kutt(a|i|e|aa|ii|ey)/, word: 'kutta' }
  ];
  
  for (const { pattern, word } of phoneticPatterns) {
    if (pattern.test(normalized)) {
      return word;
    }
  }
  
  return null;
};

/**
 * Validate username against banned words and patterns
 * @param {string} username - The username to validate
 * @returns {Object} - { isValid: boolean, message: string }
 */
export const validateUsername = (username) => {
  // Basic validation
  if (!username || typeof username !== 'string') {
    return {
      isValid: false,
      message: 'Username is required'
    };
  }
  
  const trimmedUsername = username.trim();
  
  // Length validation
  if (trimmedUsername.length < 2) {
    return {
      isValid: false,
      message: 'Username must be at least 2 characters long'
    };
  }
  
  if (trimmedUsername.length > 50) {
    return {
      isValid: false,
      message: 'Username must not exceed 50 characters'
    };
  }
  
  // Check for banned words
  const bannedWord = containsBannedWord(trimmedUsername);
  if (bannedWord) {
    return {
      isValid: false,
      message: 'This username violates our community standards. Please choose a different name.'
    };
  }
  
  // Check for phonetic variations
  const phoneticMatch = checkPhoneticVariations(trimmedUsername);
  if (phoneticMatch) {
    return {
      isValid: false,
      message: 'This username contains inappropriate language. Please choose a different name.'
    };
  }
  
  // Check for excessive special characters (potential obfuscation)
  const specialCharCount = (trimmedUsername.match(/[^a-zA-Z0-9\s]/g) || []).length;
  const totalLength = trimmedUsername.length;
  
  if (specialCharCount / totalLength > 0.5) {
    return {
      isValid: false,
      message: 'Username contains too many special characters. Please use a simpler name.'
    };
  }
  
  // Check for excessive numbers (potential obfuscation)
  const numberCount = (trimmedUsername.match(/[0-9]/g) || []).length;
  
  if (numberCount / totalLength > 0.6) {
    return {
      isValid: false,
      message: 'Username contains too many numbers. Please use a more readable name.'
    };
  }
  
  // All checks passed
  return {
    isValid: true,
    message: 'Username is valid'
  };
};

/**
 * Sanitize username by removing potentially harmful characters
 * This is a fallback for edge cases
 */
export const sanitizeUsername = (username) => {
  if (!username) return '';
  
  return username
    .trim()
    .replace(/[<>]/g, '') // Remove HTML-like characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 50); // Enforce max length
};

export default validateUsername;
