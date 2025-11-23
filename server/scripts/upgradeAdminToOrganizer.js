import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const upgradeAdminToOrganizer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'abhijeetbhale7@gmail.com';
    
    const user = await User.findOne({ email: adminEmail });
    
    if (!user) {
      console.log(`❌ User with email ${adminEmail} not found`);
      process.exit(1);
    }

    console.log('\n📋 Current Status:');
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Verified:', user.verified);

    // Update to organizer while keeping admin privileges
    user.role = 'organizer';
    user.verified = true;
    user.organizerProfile = {
      organizationName: 'BookHive Events Team',
      organizationType: 'community',
      contactEmail: user.email,
      contactPhone: '+1234567890',
      description: 'Official BookHive event organizer and administrator',
      approvedAt: new Date()
    };
    
    await user.save();

    console.log('\n✅ Admin upgraded to organizer!');
    console.log('   Role:', user.role);
    console.log('   Verified:', user.verified);
    console.log('\n🎯 Logout and login again to see changes');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

upgradeAdminToOrganizer();
