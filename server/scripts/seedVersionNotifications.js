import mongoose from 'mongoose';
import dotenv from 'dotenv';
import VersionNotification from '../models/VersionNotification.js';

dotenv.config();

const sampleNotifications = [
  {
    version: 'v2.1.0',
    title: 'Enhanced Wallet System & Admin Dashboard',
    description: 'Major improvements to the wallet system with new admin controls and better user experience.',
    content: `
      <p>We're excited to announce a major update to BookHive with significant improvements to our wallet system and admin dashboard!</p>
      
      <h4>Key Highlights:</h4>
      <ul>
        <li>Completely redesigned wallet management system</li>
        <li>New admin dashboard with real-time analytics</li>
        <li>Improved withdrawal processing with automated admin notes</li>
        <li>Enhanced security and error handling</li>
      </ul>
      
      <p>This update makes managing your earnings and withdrawals much easier and more transparent.</p>
    `,
    type: 'major',
    priority: 'high',
    features: [
      {
        title: 'Smart Withdrawal Processing',
        description: 'Automated admin notes and instant request removal for better workflow',
        icon: '💰'
      },
      {
        title: 'Real-time Analytics',
        description: 'Live dashboard with platform statistics and user insights',
        icon: '📊'
      },
      {
        title: 'Enhanced Security',
        description: 'Improved validation and error handling for all transactions',
        icon: '🔒'
      }
    ],
    bugFixes: [
      {
        title: 'Fixed 500 errors in withdrawal processing',
        description: 'Resolved server errors that were preventing withdrawal approvals'
      },
      {
        title: 'Corrected wallet balance calculations',
        description: 'Fixed issues with pending earnings vs available balance logic'
      }
    ],
    improvements: [
      {
        title: 'Faster loading times',
        description: 'Optimized database queries for better performance'
      },
      {
        title: 'Better error messages',
        description: 'More descriptive error messages to help users understand issues'
      }
    ],
    targetUsers: ['all'],
    releaseDate: new Date('2025-12-30')
  },
  {
    version: 'v2.0.5',
    title: 'Book Club Features & Social Improvements',
    description: 'New book club functionality and enhanced social features for better community engagement.',
    content: `
      <p>Connect with fellow book lovers through our new book club features!</p>
      
      <h4>What's New:</h4>
      <ul>
        <li>Create and join book clubs</li>
        <li>Organize reading events</li>
        <li>Enhanced messaging system</li>
        <li>Community discussions</li>
      </ul>
    `,
    type: 'minor',
    priority: 'medium',
    features: [
      {
        title: 'Book Clubs',
        description: 'Create and manage book clubs with reading schedules and discussions',
        icon: '📚'
      },
      {
        title: 'Event Organization',
        description: 'Plan and organize book-related events and meetups',
        icon: '📅'
      },
      {
        title: 'Enhanced Messaging',
        description: 'Improved chat system with file sharing and group conversations',
        icon: '💬'
      }
    ],
    bugFixes: [
      {
        title: 'Fixed notification delivery issues',
        description: 'Resolved problems with push notifications not being delivered'
      }
    ],
    improvements: [
      {
        title: 'Mobile responsiveness',
        description: 'Better mobile experience across all devices'
      }
    ],
    targetUsers: ['all'],
    releaseDate: new Date('2025-12-15')
  },
  {
    version: 'v1.9.2',
    title: 'Performance Optimizations & Bug Fixes',
    description: 'Important performance improvements and critical bug fixes for better stability.',
    content: `
      <p>This update focuses on improving the overall performance and stability of BookHive.</p>
      
      <p>We've addressed several user-reported issues and made significant performance improvements that you'll notice throughout the platform.</p>
    `,
    type: 'patch',
    priority: 'medium',
    features: [],
    bugFixes: [
      {
        title: 'Fixed search functionality',
        description: 'Resolved issues with book search not returning accurate results'
      },
      {
        title: 'Corrected user profile updates',
        description: 'Fixed problems with profile information not saving properly'
      },
      {
        title: 'Resolved image upload issues',
        description: 'Fixed book cover image uploads failing in certain browsers'
      }
    ],
    improvements: [
      {
        title: 'Database optimization',
        description: '40% faster page load times through database query optimization'
      },
      {
        title: 'Reduced memory usage',
        description: 'Optimized frontend code for better performance on older devices'
      }
    ],
    targetUsers: ['all'],
    releaseDate: new Date('2025-12-01')
  }
];

async function seedVersionNotifications() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing notifications
    await VersionNotification.deleteMany({});
    console.log('🗑️ Cleared existing version notifications');

    // Insert sample notifications
    const insertedNotifications = await VersionNotification.insertMany(sampleNotifications);
    console.log(`✅ Inserted ${insertedNotifications.length} version notifications`);

    // Display inserted notifications
    insertedNotifications.forEach(notification => {
      console.log(`📦 ${notification.version}: ${notification.title}`);
    });

    console.log('\n🎉 Version notifications seeded successfully!');
    console.log('Users will now see these notifications when they log in.');

  } catch (error) {
    console.error('❌ Error seeding version notifications:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedVersionNotifications();