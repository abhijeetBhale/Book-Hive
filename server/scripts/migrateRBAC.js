import 'dotenv/config';
import mongoose from 'mongoose';
import Role from '../models/Role.js';
import User from '../models/User.js';

// Default roles and permissions
const defaultRoles = [
  {
    name: 'user',
    displayName: 'User',
    description: 'Regular user with basic permissions',
    permissions: ['read'],
    isSystem: true,
  },
  {
    name: 'organizer',
    displayName: 'Event Organizer',
    description: 'Can create and manage events',
    permissions: ['read', 'write', 'manage_events', 'create_events'],
    isSystem: true,
  },
  {
    name: 'moderator',
    displayName: 'Moderator',
    description: 'Can moderate content and users',
    permissions: ['read', 'write', 'moderate_content', 'manage_reports'],
    isSystem: true,
  },
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full administrative access',
    permissions: [
      'read', 'write', 'delete',
      'manage_users', 'view_users', 'edit_users',
      'manage_books', 'edit_all_books', 'delete_all_books',
      'manage_events', 'create_events', 'edit_all_events',
      'moderate_content', 'manage_reports',
      'view_analytics'
    ],
    isSystem: true,
  },
  {
    name: 'superadmin',
    displayName: 'Super Administrator',
    description: 'System administrator with all permissions',
    permissions: [
      'read', 'write', 'delete',
      'manage_users', 'view_users', 'edit_users', 'delete_users',
      'manage_books', 'edit_all_books', 'delete_all_books',
      'manage_events', 'create_events', 'edit_all_events',
      'moderate_content', 'manage_reports',
      'manage_system', 'manage_roles', 'view_analytics',
      'manage_all_resources'
    ],
    isSystem: true,
  },
];

async function migrateRBAC() {
  try {
    console.log('🔄 Starting RBAC migration...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Create default roles
    console.log('\n📋 Creating default roles...');
    for (const roleData of defaultRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      
      if (existingRole) {
        // Update existing role permissions
        existingRole.permissions = roleData.permissions;
        existingRole.description = roleData.description;
        existingRole.displayName = roleData.displayName;
        await existingRole.save();
        console.log(`✅ Updated role: ${roleData.displayName}`);
      } else {
        // Create new role
        const role = new Role(roleData);
        await role.save();
        console.log(`✅ Created role: ${roleData.displayName}`);
      }
    }

    // 2. Migrate existing users to RBAC system
    console.log('\n👥 Migrating existing users...');
    const users = await User.find({});
    let migratedCount = 0;

    for (const user of users) {
      // Find corresponding role
      const role = await Role.findOne({ name: user.role });
      
      if (role && !user.roles.includes(role._id)) {
        // Add role to user
        user.roles.push(role._id);
        
        // Compute effective permissions
        await user.computeEffectivePermissions();
        await user.save();
        
        migratedCount++;
      }
    }

    console.log(`✅ Migrated ${migratedCount} users to RBAC system`);

    // 3. Create indexes
    console.log('\n📊 Creating indexes...');
    try {
      await Role.createIndexes();
      await User.createIndexes();
      console.log('✅ Indexes created');
    } catch (indexError) {
      if (indexError.code === 86) { // IndexKeySpecsConflict
        console.log('⚠️  Some indexes already exist, skipping...');
      } else {
        console.error('❌ Index creation error:', indexError.message);
      }
    }

    // 4. Verify migration
    console.log('\n🔍 Verifying migration...');
    const roleCount = await Role.countDocuments();
    const usersWithRoles = await User.countDocuments({ roles: { $exists: true, $ne: [] } });
    const totalUsers = await User.countDocuments();

    console.log(`📊 Migration Summary:`);
    console.log(`   Roles created: ${roleCount}`);
    console.log(`   Users with RBAC roles: ${usersWithRoles}/${totalUsers}`);
    console.log(`   Migration success rate: ${((usersWithRoles / totalUsers) * 100).toFixed(1)}%`);

    // 5. Test RBAC functionality
    console.log('\n🧪 Testing RBAC functionality...');
    const testUser = await User.findOne({ role: 'admin' }).populate('roles');
    if (testUser) {
      const hasPermission = testUser.hasPermission('manage_users');
      console.log(`✅ Admin permission test: ${hasPermission ? 'PASSED' : 'FAILED'}`);
    }

    console.log('\n🎉 RBAC migration completed successfully!');
    
  } catch (error) {
    console.error('❌ RBAC migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateRBAC();
}

// Also run if this is the main module (for compatibility)
if (process.argv[1] && process.argv[1].endsWith('migrateRBAC.js')) {
  migrateRBAC();
}

export default migrateRBAC;