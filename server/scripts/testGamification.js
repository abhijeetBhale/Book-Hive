import mongoose from 'mongoose';
import 'dotenv/config';
import { initializeDefaultAchievements, initializeUserStats } from '../services/achievementService.js';

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test gamification setup
const testGamification = async () => {
  try {
    console.log('🚀 Testing Gamification System...\n');

    // Initialize achievements
    console.log('1. Initializing default achievements...');
    await initializeDefaultAchievements();

    // Test achievement queries
    const Achievement = (await import('../models/Achievement.js')).default;
    const achievementCount = await Achievement.countDocuments();
    console.log(`✅ Total achievements in database: ${achievementCount}\n`);

    // List some achievements
    const sampleAchievements = await Achievement.find().limit(5).select('name category rarity rewards.points');
    console.log('📋 Sample achievements:');
    sampleAchievements.forEach(achievement => {
      console.log(`   • ${achievement.name} (${achievement.category}) - ${achievement.rarity} - ${achievement.rewards.points} pts`);
    });

    console.log('\n🎉 Gamification system test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Test API endpoints:');
    console.log('      - GET /api/achievements');
    console.log('      - GET /api/clubs');
    console.log('      - GET /api/challenges');
    console.log('   3. Check the frontend pages:');
    console.log('      - /achievements');
    console.log('      - /clubs');

  } catch (error) {
    console.error('❌ Error testing gamification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testGamification();
};

runTest();