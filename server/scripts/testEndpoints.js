// Simple test script to verify endpoints are working
// Run this after starting the server

const testEndpoints = async () => {
  const baseURL = 'http://localhost:5000/api';
  
  const endpoints = [
    '/achievements',
    '/achievements/leaderboard',
    '/clubs',
    '/challenges'
  ];

  console.log('🧪 Testing API Endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseURL}${endpoint}`);
      const status = response.ok ? '✅' : '❌';
      console.log(`${status} ${endpoint} - Status: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
  }

  console.log('\n🎉 Endpoint testing completed!');
  console.log('\nNext steps:');
  console.log('1. Test the frontend pages at /achievements and /clubs');
  console.log('2. Create a user account and test the gamification features');
  console.log('3. Add some books and see points being awarded automatically');
};

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEndpoints();
}

export default testEndpoints;