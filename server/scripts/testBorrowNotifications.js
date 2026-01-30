#!/usr/bin/env node

import 'dotenv/config';
import mongoose from 'mongoose';
import BorrowRequest from '../models/BorrowRequest.js';
import Notification from '../models/Notification.js';
import Book from '../models/Book.js';
import User from '../models/User.js';

async function testBorrowNotifications() {
  try {
    console.log('🧪 Testing Borrow Request Notification Logic\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get a sample book and users for testing
    const sampleBook = await Book.findOne({ forBorrowing: true }).populate('owner');
    const sampleBorrower = await User.findOne({ 
      _id: { $ne: sampleBook?.owner?._id } 
    });

    if (!sampleBook || !sampleBorrower) {
      console.log('❌ No suitable test data found. Need a book available for borrowing and a different user.');
      return;
    }

    console.log(`📚 Test Book: "${sampleBook.title}" owned by ${sampleBook.owner.name}`);
    console.log(`👤 Test Borrower: ${sampleBorrower.name}`);

    // Check for existing borrow request
    const existingRequest = await BorrowRequest.findOne({
      book: sampleBook._id,
      borrower: sampleBorrower._id,
      status: 'pending'
    });

    if (existingRequest) {
      console.log(`\n📋 Found existing borrow request: ${existingRequest._id}`);
      
      // Check notifications for this request
      const ownerNotifications = await Notification.find({
        userId: sampleBook.owner._id,
        type: 'borrow_request',
        'metadata.borrowRequestId': existingRequest._id
      });

      const borrowerNotifications = await Notification.find({
        userId: sampleBorrower._id,
        type: 'info',
        'metadata.borrowRequestId': existingRequest._id
      });

      console.log(`\n🔔 Notification Analysis:`);
      console.log(`   Owner notifications: ${ownerNotifications.length} (should be 1)`);
      console.log(`   Borrower notifications: ${borrowerNotifications.length} (should be 1)`);

      if (ownerNotifications.length > 1) {
        console.log('❌ DUPLICATE OWNER NOTIFICATIONS FOUND!');
        ownerNotifications.forEach((notif, index) => {
          console.log(`   ${index + 1}. Created: ${notif.createdAt}, ID: ${notif._id}`);
        });
      } else {
        console.log('✅ Owner notifications: OK');
      }

      if (borrowerNotifications.length > 1) {
        console.log('❌ DUPLICATE BORROWER NOTIFICATIONS FOUND!');
        borrowerNotifications.forEach((notif, index) => {
          console.log(`   ${index + 1}. Created: ${notif.createdAt}, ID: ${notif._id}`);
        });
      } else {
        console.log('✅ Borrower notifications: OK');
      }

      // Clean up duplicate notifications if found
      if (ownerNotifications.length > 1) {
        const toDelete = ownerNotifications.slice(1); // Keep the first one
        await Notification.deleteMany({
          _id: { $in: toDelete.map(n => n._id) }
        });
        console.log(`🧹 Cleaned up ${toDelete.length} duplicate owner notifications`);
      }

      if (borrowerNotifications.length > 1) {
        const toDelete = borrowerNotifications.slice(1); // Keep the first one
        await Notification.deleteMany({
          _id: { $in: toDelete.map(n => n._id) }
        });
        console.log(`🧹 Cleaned up ${toDelete.length} duplicate borrower notifications`);
      }

    } else {
      console.log('\n📋 No existing borrow request found for this book/borrower combination');
    }

    // Check for any duplicate notifications across all borrow requests
    console.log('\n🔍 Checking for duplicate notifications across all borrow requests...');
    
    const duplicateOwnerNotifs = await Notification.aggregate([
      { $match: { type: 'borrow_request' } },
      { 
        $group: {
          _id: {
            userId: '$userId',
            borrowRequestId: '$metadata.borrowRequestId'
          },
          count: { $sum: 1 },
          notifications: { $push: '$_id' }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    const duplicateBorrowerNotifs = await Notification.aggregate([
      { 
        $match: { 
          type: 'info',
          'metadata.borrowRequestId': { $exists: true }
        } 
      },
      { 
        $group: {
          _id: {
            userId: '$userId',
            borrowRequestId: '$metadata.borrowRequestId'
          },
          count: { $sum: 1 },
          notifications: { $push: '$_id' }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    console.log(`📊 Duplicate Analysis Results:`);
    console.log(`   Duplicate owner notifications: ${duplicateOwnerNotifs.length} groups`);
    console.log(`   Duplicate borrower notifications: ${duplicateBorrowerNotifs.length} groups`);

    if (duplicateOwnerNotifs.length === 0 && duplicateBorrowerNotifs.length === 0) {
      console.log('✅ No duplicate notifications found! The fix is working correctly.');
    } else {
      console.log('⚠️  Found duplicate notifications. The fix may need additional work.');
    }

    console.log('\n🎯 Recommendations:');
    console.log('1. Test creating a new borrow request to verify the duplicate prevention works');
    console.log('2. Monitor notification creation in the server logs');
    console.log('3. Check that frontend buttons are properly disabled during requests');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

testBorrowNotifications();