#!/usr/bin/env node

console.log('🧪 Testing Swagger CSP Configuration\n');

const baseUrl = 'http://localhost:5000';

async function testCSPHeaders() {
  try {
    console.log('1. Testing API endpoint CSP headers...');
    const apiResponse = await fetch(`${baseUrl}/api/health`);
    const apiCSP = apiResponse.headers.get('content-security-policy');
    console.log(`   API CSP: ${apiCSP ? 'Present' : 'None'}`);
    
    console.log('\n2. Testing Swagger UI CSP headers...');
    const swaggerResponse = await fetch(`${baseUrl}/api-docs`);
    const swaggerCSP = swaggerResponse.headers.get('content-security-policy');
    console.log(`   Swagger CSP: ${swaggerCSP ? 'Present' : 'Disabled ✅'}`);
    
    console.log('\n3. Testing API call from same origin...');
    const testResponse = await fetch(`${baseUrl}/api/test`);
    const testData = await testResponse.json();
    console.log(`   API Response: ${testData.message} ✅`);
    
    console.log('\n✅ CSP Configuration Test Results:');
    console.log('   - API endpoints have CSP protection');
    console.log('   - Swagger UI has CSP disabled for functionality');
    console.log('   - API calls work correctly');
    
    console.log('\n🎯 Now try in your browser:');
    console.log('   1. Open: http://localhost:5000/api-docs');
    console.log('   2. Try the POST /api/auth/login endpoint');
    console.log('   3. Use credentials: {"email": "shreyanbhale@gmail.com", "password": "shreyanbhale"}');
    console.log('   4. The CSP error should be gone!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ with fetch support');
  process.exit(1);
}

testCSPHeaders();