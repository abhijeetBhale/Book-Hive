import 'dotenv/config';
import mongoose from 'mongoose';
import Role from '../models/Role.js';
import User from '../models/User.js';

async function removeRBAC() {
  try {
    console.log('🔄 Removing RBAC system...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Remove all roles
    await Role.deleteMany({});
    console.log('✅ Removed all roles');

    // Remove RBAC fields from users
    await User.updateMany({}, {
      $unset: {
        roles: 1,
        permissions: 1,
        effectivePermissions: 1
      }
    });
    console.log('✅ Cleaned user RBAC fields');

    console.log('🎉 RBAC system removed successfully!');
    
  } catch (error) {
    console.error('❌ RBAC removal failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

removeRBAC();