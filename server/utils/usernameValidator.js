import { ALL_BANNED_WORDS, EXACT_MATCH_ONLY_WORDS, CHAR_SUBSTITUTIONS } from './bannedWords.js';

/**
 * Normalize a name/handle for banned-word matching.
 * 1. Lowercase + trim
 * 2. Decode leetspeak/substitutions (B#Ho$D!Ke -> bhosadike)
 * 3. Strip everything except a-z ("f.u.c.k" -> "fuck")
 * 4. Optionally collapse repeated letters ("fuuuck" -> "fuck")
 */
const normalizeUsername = (username, { collapseRepeats = false } = {}) => {
  if (!username || typeof username !== 'string') return '';

  let normalized = username.toLowerCase().trim();

  // Replace common character substitutions (twice to catch chained ones)
  for (let i = 0; i < 2; i++) {
    Object.entries(CHAR_SUBSTITUTIONS).forEach(([char, replacement]) => {
      normalized = normalized.split(char).join(replacement);
    });
  }

  // Remove all remaining special characters, spaces, and numbers
  normalized = normalized.replace(/[^a-z]/g, '');

  if (collapseRepeats) {
    normalized = normalized.replace(/(.)\1+/g, '$1');
  }

  return normalized;
};

// Pre-normalized exact-tier lookup set
const EXACT_ONLY_SET = new Set(
  EXACT_MATCH_ONLY_WORDS.map((w) => normalizeUsername(w))
);

// Per-letter-quantified regexes: "fuck" -> /f+u+c+k/
// Matches stretched spellings ("fuuuck", "boooobs") WITHOUT shrinking
// dictionary words into different words (the bug that made "shoot" -> "shot"
// and falsely blocked "snapshot").
const buildQuantifiedRegex = (word) =>
  new RegExp([...word].join('+'));

const SUBSTRING_MATCHERS = ALL_BANNED_WORDS
  .map((w) => ({ word: w, norm: normalizeUsername(w) }))
  .filter(({ norm }) => norm && norm.length > 1)
  .map(({ word, norm }) => ({ word, norm, re: buildQuantifiedRegex(norm) }));

const EXACT_MATCHERS = EXACT_MATCH_ONLY_WORDS
  .map((w) => ({ word: w, norm: normalizeUsername(w) }))
  .filter(({ norm }) => norm && norm.length > 1)
  .map(({ word, norm }) => ({ word, re: new RegExp(`^${[...norm].join('+')}$`) }));

/**
 * Find a banned-word match in a name.
 *  - Stretched-spelling detection via per-letter quantified regexes
 *  - EXACT tier words only match when they equal the whole name
 *  - SUBSTRING tier words match anywhere inside the name
 * Returns { word, tier } or null.
 */
const findBannedMatch = (username) => {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;

  // Exact tier: whole name must equal the word (stretched variants included)
  for (const { word, re } of EXACT_MATCHERS) {
    if (re.test(normalized)) {
      return { word, tier: 'exact' };
    }
  }

  for (const { word, re } of SUBSTRING_MATCHERS) {
    if (re.test(normalized)) {
      return { word, tier: 'substring' };
    }
  }

  // Reverse containment: short names that are prefixes of longer banned terms
  if (normalized.length >= 4) {
    for (const { word, norm } of SUBSTRING_MATCHERS) {
      if (norm.startsWith(normalized)) {
        return { word, tier: 'substring' };
      }
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
    // Requires "l + vowel + nd" so innocent words like "cloud" don't match
    { pattern: /l(u|oo|o|au|aw)nd(a|aa|i|ee|e|ey|u|uu|o)?/, word: 'lund' },
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
 * Validate a name/handle against banned words and patterns.
 * Used for BOTH the @handle (username) and the display Full Name.
 * @param {string} username - The name or handle to validate
 * @returns {Object} - { isValid: boolean, message: string }
 */
export const validateUsername = (username) => {
  // Basic validation
  if (!username || typeof username !== 'string') {
    return {
      isValid: false,
      message: 'Name is required'
    };
  }

  const trimmedUsername = username.trim();

  // Length validation
  if (trimmedUsername.length < 2) {
    return {
      isValid: false,
      message: 'Name must be at least 2 characters long'
    };
  }

  if (trimmedUsername.length > 50) {
    return {
      isValid: false,
      message: 'Name must not exceed 50 characters'
    };
  }

  // Check for banned words (substring + exact tiers, obfuscation-resistant)
  const bannedMatch = findBannedMatch(trimmedUsername);
  if (bannedMatch) {
    return {
      isValid: false,
      message: 'This name violates our community standards. Please choose a different one.'
    };
  }

  // Check for phonetic variations
  const phoneticMatch = checkPhoneticVariations(trimmedUsername);
  if (phoneticMatch) {
    return {
      isValid: false,
      message: 'This name contains inappropriate language. Please choose a different one.'
    };
  }

  // Check for excessive special characters (potential obfuscation)
  const specialCharCount = (trimmedUsername.match(/[^a-zA-Z0-9\s]/g) || []).length;
  const totalLength = trimmedUsername.length;

  if (specialCharCount / totalLength > 0.5) {
    return {
      isValid: false,
      message: 'Name contains too many special characters. Please use a simpler name.'
    };
  }

  // Check for excessive numbers (potential obfuscation)
  const numberCount = (trimmedUsername.match(/[0-9]/g) || []).length;

  if (numberCount / totalLength > 0.6) {
    return {
      isValid: false,
      message: 'Name contains too many numbers. Please use a more readable name.'
    };
  }

  // All checks passed
  return {
    isValid: true,
    message: 'Name is valid'
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
