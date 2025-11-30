import { validateUsername } from './usernameValidator.js';

// Test cases for username validation
const testCases = [
  // Valid usernames
  { username: 'JohnDoe', expected: true },
  { username: 'Priya123', expected: true },
  { username: 'BookLover', expected: true },
  { username: 'Rahul Kumar', expected: true },
  { username: 'ReadingFan', expected: true },
  { username: 'BookWorm2024', expected: true },
  
  // English offensive words - Sexual
  { username: 'fuckyou', expected: false },
  { username: 'f*ck', expected: false },
  { username: 'f4ck', expected: false },
  { username: 'fck123', expected: false },
  { username: 'sexygirl', expected: false },
  { username: 'pornstar', expected: false },
  { username: 'xxx_user', expected: false },
  { username: 'cumslut', expected: false },
  { username: 'cumdump', expected: false },
  { username: 'hornyboy', expected: false },
  { username: 'hornygirl', expected: false },
  { username: 'deepthroat', expected: false },
  { username: 'blowjob', expected: false },
  { username: 'handjob', expected: false },
  { username: 'camwhore', expected: false },
  { username: 'onlyfans', expected: false },
  { username: 'escortgirl', expected: false },
  { username: 'analqueen', expected: false },
  { username: 'gangbang', expected: false },
  { username: 'threesome', expected: false },
  
  // English offensive words - Violence
  { username: 'killer123', expected: false },
  { username: 'serialkiller', expected: false },
  { username: 'massmurder', expected: false },
  { username: 'psychokiller', expected: false },
  { username: 'bloodlust', expected: false },
  { username: 'skullcrusher', expected: false },
  { username: 'bonecrusher', expected: false },
  { username: 'terrorist', expected: false },
  { username: 'bomber', expected: false },
  
  // English offensive words - Hate
  { username: 'nazi_power', expected: false },
  { username: 'hitler', expected: false },
  { username: 'kkk', expected: false },
  { username: 'faggot', expected: false },
  { username: 'nigger', expected: false },
  { username: 'nigga', expected: false },
  { username: 'killgays', expected: false },
  { username: 'gaykiller', expected: false },
  { username: 'islamhater', expected: false },
  { username: 'jewhater', expected: false },
  
  // English offensive words - Self-harm
  { username: 'suicide', expected: false },
  { username: 'killme', expected: false },
  { username: 'wanttodie', expected: false },
  { username: 'endmylife', expected: false },
  { username: 'selfharm', expected: false },
  
  // Hindi/Hinglish offensive words - Sexual
  { username: 'chutiya', expected: false },
  { username: 'chutya', expected: false },
  { username: 'ch4tiya', expected: false },
  { username: 'madarchod', expected: false },
  { username: 'maderchod', expected: false },
  { username: 'behenchod', expected: false },
  { username: 'bhenchod', expected: false },
  { username: 'bhosdike', expected: false },
  { username: 'bhosadike', expected: false },
  { username: 'bsdk123', expected: false },
  { username: 'gandu', expected: false },
  { username: 'lund', expected: false },
  { username: 'loda', expected: false },
  { username: 'randi', expected: false },
  { username: 'mc', expected: false },
  { username: 'bc', expected: false },
  { username: 'mcbc', expected: false },
  { username: 'chutiyapanti', expected: false },
  { username: 'gaandmasti', expected: false },
  { username: 'gaandfat', expected: false },
  
  // Hindi/Hinglish offensive words - Abusive
  { username: 'harami', expected: false },
  { username: 'kameena', expected: false },
  { username: 'kutta', expected: false },
  { username: 'suar', expected: false },
  { username: 'nalayak', expected: false },
  { username: 'ghatiya', expected: false },
  { username: 'saala', expected: false },
  { username: 'nikamma', expected: false },
  { username: 'bewakoof', expected: false },
  
  // Hindi/Hinglish offensive words - Violence
  { username: 'maar_dunga', expected: false },
  { username: 'mar_dunga', expected: false },
  { username: 'kat_dunga', expected: false },
  { username: 'jala_dunga', expected: false },
  { username: 'katal', expected: false },
  { username: 'mardenge', expected: false },
  { username: 'phod_dunga', expected: false },
  { username: 'chaku_mar', expected: false },
  
  // Hindi/Hinglish offensive words - Hate
  { username: 'muslimhater', expected: false },
  { username: 'hinduhater', expected: false },
  { username: 'chamar', expected: false },
  { username: 'bhangi', expected: false },
  { username: 'katua', expected: false },
  { username: 'katwa', expected: false },
  { username: 'deshdrohi', expected: false },
  { username: 'antinational', expected: false },
  { username: 'pakistansucks', expected: false },
  { username: 'bihari_hater', expected: false },
  
  // Hindi/Hinglish offensive words - Women-targeted
  { username: 'randika_baccha', expected: false },
  { username: 'bhabhixxx', expected: false },
  { username: 'desisexbhabhi', expected: false },
  { username: 'sexybhabhi', expected: false },
  { username: 'chudail', expected: false },
  { username: 'itemgirl', expected: false },
  
  // Hindi/Hinglish offensive words - Self-harm
  { username: 'khudkushi', expected: false },
  { username: 'aatmhatya', expected: false },
  { username: 'mar_jaunga', expected: false },
  { username: 'marna_chahta_hu', expected: false },
  { username: 'jeena_nahi', expected: false },
  
  // Obfuscated versions
  { username: 'B#Ho$D!Ke', expected: false },
  { username: 'ch@t!ya', expected: false },
  { username: 'm4d4rch0d', expected: false },
  { username: 'b3h3nch0d', expected: false },
  { username: 'g@ndu', expected: false },
  { username: 'l0nd', expected: false },
  { username: 'r@ndi', expected: false },
  { username: 'f@ck', expected: false },
  { username: 'p0rn', expected: false },
  { username: 'k!ller', expected: false },
  
  // Phonetic variations
  { username: 'chutiye', expected: false },
  { username: 'chutiyaa', expected: false },
  { username: 'chutiyah', expected: false },
  { username: 'madharchod', expected: false },
  { username: 'madarchodd', expected: false },
  { username: 'bhnchod', expected: false },
  { username: 'behnchod', expected: false },
  { username: 'bosdk', expected: false },
  { username: 'bhosdk', expected: false },
  { username: 'gaandu', expected: false },
  { username: 'ganduu', expected: false },
  { username: 'lauda', expected: false },
  { username: 'lawda', expected: false },
  { username: 'randii', expected: false },
  { username: 'haramii', expected: false },
  { username: 'kamina', expected: false },
  { username: 'kaminey', expected: false },
  { username: 'kuttaa', expected: false },
  { username: 'kutti', expected: false },
  
  // Platform impersonation
  { username: 'bookhiveadmin', expected: false },
  { username: 'bookhive_admin', expected: false },
  { username: 'officialbookhive', expected: false },
  { username: 'bookhivesupport', expected: false },
  { username: 'admin123', expected: false },
  { username: 'moderator', expected: false },
  { username: 'support_team', expected: false },
  { username: 'superadmin', expected: false },
  { username: 'bookhivemod', expected: false },
  { username: 'securityadmin', expected: false },
  { username: 'techsupport', expected: false },
  
  // Edge cases
  { username: 'a', expected: false }, // Too short
  { username: '', expected: false }, // Empty
  { username: '!@#$%^&*()', expected: false }, // Too many special chars
  { username: '12345678', expected: false }, // Too many numbers
];

console.log('🧪 Testing Username Validator\n');
console.log('=' .repeat(80));

let passed = 0;
let failed = 0;

testCases.forEach(({ username, expected }) => {
  const result = validateUsername(username);
  const isValid = result.isValid;
  const success = isValid === expected;
  
  if (success) {
    passed++;
    console.log(`✅ PASS: "${username}" - ${isValid ? 'Valid' : 'Invalid'}`);
  } else {
    failed++;
    console.log(`❌ FAIL: "${username}" - Expected: ${expected}, Got: ${isValid}`);
    console.log(`   Message: ${result.message}`);
  }
});

console.log('=' .repeat(80));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(2)}%\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
} else {
  console.log('⚠️  Some tests failed. Please review the implementation.');
}
