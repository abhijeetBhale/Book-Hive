import 'dotenv/config';

console.log('🔍 Google OAuth Configuration Test:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set ✅' : 'Not set ❌');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set ✅' : 'Not set ❌');
console.log('CLIENT_URL:', process.env.CLIENT_URL);

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('✅ Google OAuth is properly configured');
  console.log('📋 Expected callback URL in Google Console:');
  console.log('   - For local development: http://localhost:5000/api/auth/google/callback');
  console.log('   - For production: https://your-server-domain.vercel.app/api/auth/google/callback');
} else {
  console.log('❌ Google OAuth credentials missing');
}