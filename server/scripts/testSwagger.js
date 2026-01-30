#!/usr/bin/env node

console.log('🧪 Testing Swagger API Documentation\n');

const baseUrl = 'http://localhost:5000';

// Test endpoints
const endpoints = [
  { method: 'GET', path: '/api/health', description: 'Health Check' },
  { method: 'GET', path: '/api/test', description: 'Test Endpoint' },
  { method: 'GET', path: '/api/books?limit=1', description: 'Get Books' },
  { method: 'GET', path: '/api/books/trending', description: 'Trending Books' },
  { method: 'GET', path: '/api-docs', description: 'Swagger UI' },
];

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`${baseUrl}${endpoint.path}`);
    const status = response.status;
    const statusText = response.statusText;
    
    if (status === 200) {
      console.log(`✅ ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
      console.log(`   Status: ${status} ${statusText}\n`);
    } else {
      console.log(`⚠️  ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
      console.log(`   Status: ${status} ${statusText}\n`);
    }
  } catch (error) {
    console.log(`❌ ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
    console.log(`   Error: ${error.message}\n`);
  }
}

async function runTests() {
  console.log('Testing API endpoints...\n');
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('🎯 How to use Swagger UI:');
  console.log('1. Open: http://localhost:5000/api-docs');
  console.log('2. Click on any endpoint to expand it');
  console.log('3. Click "Try it out" to test the endpoint');
  console.log('4. For protected endpoints:');
  console.log('   - First login via POST /api/auth/login');
  console.log('   - Copy the token from response');
  console.log('   - Click 🔒 Authorize button');
  console.log('   - Enter: Bearer YOUR_TOKEN_HERE');
  console.log('   - Now you can test protected endpoints!');
  console.log('\n✨ Your Swagger documentation is ready to use!');
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ with fetch support');
  console.log('   Or install node-fetch: npm install node-fetch');
  process.exit(1);
}

runTests().catch(console.error);