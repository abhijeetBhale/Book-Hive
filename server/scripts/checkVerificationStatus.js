import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const checkVerificationStatus = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Fetch all users
    const users = await User.find({}).select('name email isVerified verificationPrompt location');

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                    VERIFICATION STATUS REPORT');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    console.log(`Total Users: ${users.length}\n`);

    // Categorize users
    const verifiedUsers = [];
    const unverifiedWithPopup = [];
    const unverifiedWithNotification = [];
    const unverifiedNoPrompts = [];

    users.forEach(user => {
      const userData = {
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        hasCompletedProfileSetup: user.verificationPrompt?.hasCompletedProfileSetup || false,
        hasSeenFloatingPopup: user.verificationPrompt?.hasSeenFloatingPopup || false,
        permanentlyDismissed: user.verificationPrompt?.permanentlyDismissed || false,
        hasLocation: !!(user.location?.coordinates && user.location.coordinates[0] !== 0),
        showCount: user.verificationPrompt?.showCount || 0
      };

      // Determine what prompts should show
      const shouldShowFloatingPopup = 
        !userData.isVerified &&
        !userData.hasSeenFloatingPopup &&
        !userData.permanentlyDismissed &&
        userData.hasCompletedProfileSetup;

      const shouldShowNotification = 
        !userData.isVerified && 
        !userData.permanentlyDismissed;

      userData.shouldShowFloatingPopup = shouldShowFloatingPopup;
      userData.shouldShowNotification = shouldShowNotification;

      // Categorize
      if (userData.isVerified) {
        verifiedUsers.push(userData);
      } else if (shouldShowFloatingPopup) {
        unverifiedWithPopup.push(userData);
      } else if (shouldShowNotification) {
        unverifiedWithNotification.push(userData);
      } else {
        unverifiedNoPrompts.push(userData);
      }
    });

    // Display Verified Users
    console.log('───────────────────────────────────────────────────────────────────────────────');
    console.log(`✅ VERIFIED USERS (${verifiedUsers.length})`);
    console.log('   These users will NOT see any verification prompts');
    console.log('───────────────────────────────────────────────────────────────────────────────');
    if (verifiedUsers.length === 0) {
      console.log('   No verified users found.\n');
    } else {
      verifiedUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`);
        console.log(`      ✓ Verified Badge: YES`);
        console.log(`      ✓ Shows Popup: NO`);
        console.log(`      ✓ Shows Notification: NO\n`);
      });
    }

    // Display Unverified Users Who Should See Floating Popup
    console.log('───────────────────────────────────────────────────────────────────────────────');
    console.log(`🔔 UNVERIFIED - WILL SEE FLOATING POPUP (${unverifiedWithPopup.length})`);
    console.log('   These users completed profile setup and will see the floating popup');
    console.log('───────────────────────────────────────────────────────────────────────────────');
    if (unverifiedWithPopup.length === 0) {
      console.log('   No users will see the floating popup.\n');
    } else {
      unverifiedWithPopup.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`);
        console.log(`      • Verified Badge: NO`);
        console.log(`      • Profile Setup Complete: ${user.hasCompletedProfileSetup ? 'YES' : 'NO'}`);
        console.log(`      • Has Location: ${user.hasLocation ? 'YES' : 'NO'}`);
        console.log(`      • Has Seen Popup: ${user.hasSeenFloatingPopup ? 'YES' : 'NO'}`);
        console.log(`      • Permanently Dismissed: ${user.permanentlyDismissed ? 'YES' : 'NO'}`);
        console.log(`      • Show Count: ${user.showCount}`);
        console.log(`      ✓ Shows Popup: YES (after 3 seconds)`);
        console.log(`      ✓ Shows Notification: YES (in notification panel)\n`);
      });
    }

    // Display Unverified Users Who Should See Only Notification
    console.log('───────────────────────────────────────────────────────────────────────────────');
    console.log(`📬 UNVERIFIED - WILL SEE NOTIFICATION ONLY (${unverifiedWithNotification.length})`);
    console.log('   These users will see notification in panel but not floating popup');
    console.log('───────────────────────────────────────────────────────────────────────────────');
    if (unverifiedWithNotification.length === 0) {
      console.log('   No users will see notification only.\n');
    } else {
      unverifiedWithNotification.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`);
        console.log(`      • Verified Badge: NO`);
        console.log(`      • Profile Setup Complete: ${user.hasCompletedProfileSetup ? 'YES' : 'NO'}`);
        console.log(`      • Has Location: ${user.hasLocation ? 'YES' : 'NO'}`);
        console.log(`      • Has Seen Popup: ${user.hasSeenFloatingPopup ? 'YES' : 'NO'}`);
        console.log(`      • Permanently Dismissed: ${user.permanentlyDismissed ? 'YES' : 'NO'}`);
        console.log(`      • Show Count: ${user.showCount}`);
        console.log(`      ✓ Shows Popup: NO (${!user.hasCompletedProfileSetup ? 'profile not setup' : 'already seen'})`);
        console.log(`      ✓ Shows Notification: YES (in notification panel)\n`);
      });
    }

    // Display Unverified Users Who Won't See Any Prompts
    console.log('───────────────────────────────────────────────────────────────────────────────');
    console.log(`🚫 UNVERIFIED - NO PROMPTS (${unverifiedNoPrompts.length})`);
    console.log('   These users permanently dismissed all verification prompts');
    console.log('───────────────────────────────────────────────────────────────────────────────');
    if (unverifiedNoPrompts.length === 0) {
      console.log('   No users have permanently dismissed prompts.\n');
    } else {
      unverifiedNoPrompts.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`);
        console.log(`      • Verified Badge: NO`);
        console.log(`      • Profile Setup Complete: ${user.hasCompletedProfileSetup ? 'YES' : 'NO'}`);
        console.log(`      • Has Location: ${user.hasLocation ? 'YES' : 'NO'}`);
        console.log(`      • Permanently Dismissed: YES`);
        console.log(`      ✓ Shows Popup: NO (permanently dismissed)`);
        console.log(`      ✓ Shows Notification: NO (permanently dismissed)\n`);
      });
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                              SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log(`Total Users:                           ${users.length}`);
    console.log(`Verified Users:                        ${verifiedUsers.length}`);
    console.log(`Unverified (Will See Popup):           ${unverifiedWithPopup.length}`);
    console.log(`Unverified (Notification Only):        ${unverifiedWithNotification.length}`);
    console.log(`Unverified (No Prompts):               ${unverifiedNoPrompts.length}`);
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    // Recommendations
    console.log('📋 RECOMMENDATIONS:');
    console.log('───────────────────────────────────────────────────────────────────────────────');
    if (unverifiedWithPopup.length > 0) {
      console.log(`✓ ${unverifiedWithPopup.length} user(s) will see the floating popup on next login`);
    }
    if (unverifiedWithNotification.length > 0) {
      console.log(`✓ ${unverifiedWithNotification.length} user(s) will see verification in notification panel`);
    }
    if (verifiedUsers.length === users.length) {
      console.log('✓ All users are verified! No prompts will be shown.');
    }
    if (unverifiedNoPrompts.length > 0) {
      console.log(`⚠ ${unverifiedNoPrompts.length} user(s) permanently dismissed prompts (won't see any reminders)`);
    }
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
};

// Run the script
checkVerificationStatus();
