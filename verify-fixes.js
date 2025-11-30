#!/usr/bin/env node

/**
 * Verification script to check if all fixes are in place
 * Run with: node verify-fixes.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const checks = [];
let passed = 0;
let failed = 0;

function check(name, condition, details = '') {
  checks.push({ name, passed: condition, details });
  if (condition) {
    passed++;
    console.log(`✅ ${name}`);
  } else {
    failed++;
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

console.log('\n🔍 Verifying BookHive Deployment Fixes...\n');

// Check 1: Auth middleware has user existence check
const authMiddleware = fs.readFileSync(path.join(__dirname, 'server/middleware/auth.js'), 'utf8');
check(
  'Auth middleware checks user existence',
  authMiddleware.includes('if (!req.user)') && authMiddleware.includes('USER_NOT_FOUND'),
  'Auth middleware should check if user exists after JWT verification'
);

// Check 2: No req.user.id in controllers (excluding comments)
const controllersDir = path.join(__dirname, 'server/controllers');
const controllers = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));
let hasReqUserId = false;
controllers.forEach(file => {
  const content = fs.readFileSync(path.join(controllersDir, file), 'utf8');
  // Remove comments before checking
  const contentWithoutComments = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  if (contentWithoutComments.match(/req\.user\.id[^_]/)) {
    hasReqUserId = true;
    console.log(`   Found req.user.id in ${file}`);
  }
});
check(
  'No req.user.id in controllers',
  !hasReqUserId,
  'All controllers should use req.user._id instead of req.user.id'
);

// Check 3: Notification controller has auth checks
const notifController = fs.readFileSync(path.join(__dirname, 'server/controllers/notificationController.js'), 'utf8');
check(
  'Notification controller has auth checks',
  notifController.includes('if (!req.user || !req.user._id)'),
  'Notification controller should validate user authentication'
);

// Check 4: Auth controller has enhanced error logging
const authController = fs.readFileSync(path.join(__dirname, 'server/controllers/authController.js'), 'utf8');
check(
  'Auth controller has enhanced logging',
  authController.includes('console.log(\'getProfile called for user:\''),
  'Auth controller should log user operations'
);

// Check 5: Friends controller uses _id
const friendController = fs.readFileSync(path.join(__dirname, 'server/controllers/friendController.js'), 'utf8');
check(
  'Friends controller uses req.user._id',
  friendController.includes('req.user._id') && !friendController.match(/req\.user\.id[^_]/),
  'Friends controller should use _id consistently'
);

// Check 6: Manifest has correct icon paths
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'client/public/manifest.json'), 'utf8'));
const iconPathsCorrect = manifest.icons.every(icon => icon.src === '/icons8-bee-100.png');
check(
  'Manifest icon paths are correct',
  iconPathsCorrect,
  'All icon paths should be /icons8-bee-100.png'
);

// Check 7: Icon file exists in public folder
const iconExists = fs.existsSync(path.join(__dirname, 'client/public/icons8-bee-100.png'));
check(
  'Icon file exists in public folder',
  iconExists,
  'icons8-bee-100.png should be in client/public/'
);

// Check 8: Message controller uses _id
const messageController = fs.readFileSync(path.join(__dirname, 'server/controllers/messageController.js'), 'utf8');
check(
  'Message controller uses req.user._id',
  messageController.includes('req.user._id') && !messageController.match(/req\.user\.id[^_]/),
  'Message controller should use _id consistently'
);

// Summary
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All checks passed! Ready to deploy.\n');
  console.log('Next steps:');
  console.log('1. git add .');
  console.log('2. git commit -m "Fix: Resolve 500 errors and deployment issues"');
  console.log('3. git push origin main');
  console.log('4. Deploy on Render/Vercel\n');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Please review the issues above.\n');
  process.exit(1);
}
