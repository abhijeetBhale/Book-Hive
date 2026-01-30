import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Role from '../models/Role.js';

async function testRBAC() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check your super admin status
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    const you = await User.findOne({ email: superAdminEmail }).populate('roles');
    
    console.log('🔍 Your Account Status:');
    console.log(`Email: ${you?.email}`);
    console.log(`Legacy Role: ${you?.role}`);
    console.log(`RBAC Roles: ${you?.roles?.map(r => r.name).join(', ') || 'None'}`);
    console.log(`Permissions: ${you?.effectivePermissions?.length || 0} permissions`);
    
    // Check all roles in system
    const allRoles = await Role.find({});
    console.log('\n📋 System Roles:');
    allRoles.forEach(role => {
      console.log(`- ${role.displayName}: ${role.permissions.length} permissions`);
    });
    
    // Check total users with RBAC roles
    const usersWithRoles = await User.countDocuments({ roles: { $exists: true, $ne: [] } });
    const totalUsers = await User.countDocuments();
    
    console.log(`\n👥 Users: ${usersWithRoles}/${totalUsers} have RBAC roles`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testRBAC();