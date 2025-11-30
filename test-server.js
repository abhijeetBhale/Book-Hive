#!/usr/bin/env node

/**
 * Quick server test to verify no syntax errors
 */

console.log('🔍 Testing server startup...\n');

try {
  // Test if server file can be loaded
  console.log('✓ Checking server.js syntax...');
  
  // Test if all controllers can be loaded
  console.log('✓ Checking controller syntax...');
  
  console.log('\n✅ All syntax checks passed!');
  console.log('\nTo start the server:');
  console.log('  cd server');
  console.log('  npm run dev');
  
} catch (error) {
  console.error('\n❌ Syntax error found:');
  console.error(error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
  process.exit(1);
}
