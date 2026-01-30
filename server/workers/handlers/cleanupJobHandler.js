import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';

// Cleanup expired tokens (JWT blacklist, password reset tokens, etc.)
const cleanupExpiredTokens = async (data) => {
  try {
    const { olderThanDays = 7 } = data;
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    
    // Clean up password reset tokens
    const User = mongoose.model('User');
    const result = await User.updateMany(
      {
        'passwordReset.expires': { $lt: cutoffDate }
      },
      {
        $unset: {
          'passwordReset.token': 1,
          'passwordReset.expires': 1
        }
      }
    );
    
    // TODO: Clean up JWT blacklist if implemented
    // const BlacklistedToken = mongoose.model('BlacklistedToken');
    // const blacklistResult = await BlacklistedToken.deleteMany({
    //   expiresAt: { $lt: new Date() }
    // });
    
    return {
      success: true,
      passwordResetTokensCleared: result.modifiedCount,
      cutoffDate: cutoffDate.toISOString(),
    };
  } catch (error) {
    console.error('Token cleanup failed:', error);
    throw new Error(`Failed to cleanup expired tokens: ${error.message}`);
  }
};

// Cleanup old notifications
const cleanupOldNotifications = async (data) => {
  try {
    const { olderThanDays = 30 } = data;
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    
    // Clean up old notifications
    const Notification = mongoose.model('Notification');
    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true // Only delete read notifications
    });
    
    return {
      success: true,
      notificationsDeleted: result.deletedCount,
      cutoffDate: cutoffDate.toISOString(),
    };
  } catch (error) {
    console.error('Notification cleanup failed:', error);
    throw new Error(`Failed to cleanup old notifications: ${error.message}`);
  }
};

// Cleanup temporary files
const cleanupTempFiles = async (data) => {
  try {
    const { tempDir = './uploads/temp', olderThanHours = 24 } = data;
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;
    
    let filesDeleted = 0;
    let totalSize = 0;
    
    try {
      const files = await fs.readdir(tempDir);
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          totalSize += stats.size;
          await fs.unlink(filePath);
          filesDeleted++;
        }
      }
    } catch (dirError) {
      // Directory might not exist, which is fine
      if (dirError.code !== 'ENOENT') {
        throw dirError;
      }
    }
    
    return {
      success: true,
      filesDeleted,
      totalSizeFreed: totalSize,
      cutoffTime: new Date(cutoffTime).toISOString(),
    };
  } catch (error) {
    console.error('Temp file cleanup failed:', error);
    throw new Error(`Failed to cleanup temp files: ${error.message}`);
  }
};

// Cleanup inactive user sessions
const cleanupInactiveSessions = async (data) => {
  try {
    const { inactiveDays = 30 } = data;
    const cutoffDate = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);
    
    const User = mongoose.model('User');
    
    // Mark users as inactive if they haven't been active
    const result = await User.updateMany(
      {
        lastActive: { $lt: cutoffDate },
        isActive: true
      },
      {
        $set: { isActive: false }
      }
    );
    
    return {
      success: true,
      usersMarkedInactive: result.modifiedCount,
      cutoffDate: cutoffDate.toISOString(),
    };
  } catch (error) {
    console.error('Session cleanup failed:', error);
    throw new Error(`Failed to cleanup inactive sessions: ${error.message}`);
  }
};

// Cleanup old borrow requests
const cleanupOldBorrowRequests = async (data) => {
  try {
    const { olderThanDays = 90 } = data;
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    
    const BorrowRequest = mongoose.model('BorrowRequest');
    
    // Delete old completed or rejected requests
    const result = await BorrowRequest.deleteMany({
      createdAt: { $lt: cutoffDate },
      status: { $in: ['completed', 'rejected', 'cancelled'] }
    });
    
    return {
      success: true,
      requestsDeleted: result.deletedCount,
      cutoffDate: cutoffDate.toISOString(),
    };
  } catch (error) {
    console.error('Borrow request cleanup failed:', error);
    throw new Error(`Failed to cleanup old borrow requests: ${error.message}`);
  }
};

// Comprehensive cleanup (runs all cleanup tasks)
const comprehensiveCleanup = async (data) => {
  try {
    const results = {};
    
    // Run all cleanup tasks
    results.tokens = await cleanupExpiredTokens(data);
    results.notifications = await cleanupOldNotifications(data);
    results.tempFiles = await cleanupTempFiles(data);
    results.sessions = await cleanupInactiveSessions(data);
    results.borrowRequests = await cleanupOldBorrowRequests(data);
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      results,
    };
  } catch (error) {
    console.error('Comprehensive cleanup failed:', error);
    throw new Error(`Failed to run comprehensive cleanup: ${error.message}`);
  }
};

export default {
  cleanupExpiredTokens,
  cleanupOldNotifications,
  cleanupTempFiles,
  cleanupInactiveSessions,
  cleanupOldBorrowRequests,
  comprehensiveCleanup,
};