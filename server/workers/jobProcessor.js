import 'dotenv/config';
import { Worker } from 'bullmq';
import redisClient from '../config/redis.js';
import { JOB_TYPES } from '../services/jobQueue.js';

// Import job handlers
import emailJobHandler from './handlers/emailJobHandler.js';
import notificationJobHandler from './handlers/notificationJobHandler.js';
import imageJobHandler from './handlers/imageJobHandler.js';
import cleanupJobHandler from './handlers/cleanupJobHandler.js';

// Worker configuration
const workerConfig = {
  connection: redisClient.client,
  concurrency: 5, // Process up to 5 jobs concurrently
  removeOnComplete: 100,
  removeOnFail: 50,
};

// Email worker
const emailWorker = new Worker('email', async (job) => {
  console.log(`📧 Processing email job: ${job.name} (ID: ${job.id})`);
  
  try {
    switch (job.name) {
      case JOB_TYPES.SEND_EMAIL:
        return await emailJobHandler.sendEmail(job.data);
      case JOB_TYPES.SEND_WELCOME_EMAIL:
        return await emailJobHandler.sendWelcomeEmail(job.data);
      case JOB_TYPES.SEND_BORROW_REQUEST_EMAIL:
        return await emailJobHandler.sendBorrowRequestEmail(job.data);
      case JOB_TYPES.SEND_REMINDER_EMAIL:
        return await emailJobHandler.sendReminderEmail(job.data);
      case JOB_TYPES.SEND_OVERDUE_EMAIL:
        return await emailJobHandler.sendOverdueEmail(job.data);
      default:
        throw new Error(`Unknown email job type: ${job.name}`);
    }
  } catch (error) {
    console.error(`❌ Email job failed: ${job.name}`, error);
    throw error;
  }
}, workerConfig);

// Notification worker
const notificationWorker = new Worker('notification', async (job) => {
  console.log(`🔔 Processing notification job: ${job.name} (ID: ${job.id})`);
  
  try {
    switch (job.name) {
      case JOB_TYPES.SEND_PUSH_NOTIFICATION:
        return await notificationJobHandler.sendPushNotification(job.data);
      case JOB_TYPES.SEND_SOCKET_NOTIFICATION:
        return await notificationJobHandler.sendSocketNotification(job.data);
      default:
        throw new Error(`Unknown notification job type: ${job.name}`);
    }
  } catch (error) {
    console.error(`❌ Notification job failed: ${job.name}`, error);
    throw error;
  }
}, workerConfig);

// Image processing worker
const imageWorker = new Worker('image-processing', async (job) => {
  console.log(`🖼️  Processing image job: ${job.name} (ID: ${job.id})`);
  
  try {
    switch (job.name) {
      case JOB_TYPES.OPTIMIZE_IMAGE:
        return await imageJobHandler.optimizeImage(job.data);
      case JOB_TYPES.GENERATE_THUMBNAILS:
        return await imageJobHandler.generateThumbnails(job.data);
      default:
        throw new Error(`Unknown image job type: ${job.name}`);
    }
  } catch (error) {
    console.error(`❌ Image job failed: ${job.name}`, error);
    throw error;
  }
}, workerConfig);

// Cleanup worker
const cleanupWorker = new Worker('cleanup', async (job) => {
  console.log(`🧹 Processing cleanup job: ${job.name} (ID: ${job.id})`);
  
  try {
    switch (job.name) {
      case JOB_TYPES.CLEANUP_EXPIRED_TOKENS:
        return await cleanupJobHandler.cleanupExpiredTokens(job.data);
      case JOB_TYPES.CLEANUP_OLD_NOTIFICATIONS:
        return await cleanupJobHandler.cleanupOldNotifications(job.data);
      case JOB_TYPES.CLEANUP_TEMP_FILES:
        return await cleanupJobHandler.cleanupTempFiles(job.data);
      default:
        throw new Error(`Unknown cleanup job type: ${job.name}`);
    }
  } catch (error) {
    console.error(`❌ Cleanup job failed: ${job.name}`, error);
    throw error;
  }
}, workerConfig);

// Worker event handlers
const setupWorkerEvents = (worker, workerName) => {
  worker.on('completed', (job) => {
    console.log(`✅ ${workerName} job completed: ${job.name} (ID: ${job.id})`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ ${workerName} job failed: ${job?.name} (ID: ${job?.id})`, err);
  });

  worker.on('progress', (job, progress) => {
    console.log(`⏳ ${workerName} job progress: ${job.name} (${progress}%)`);
  });

  worker.on('stalled', (jobId) => {
    console.warn(`⚠️  ${workerName} job stalled: ${jobId}`);
  });

  worker.on('error', (err) => {
    console.error(`❌ ${workerName} worker error:`, err);
  });
};

// Setup event handlers for all workers
setupWorkerEvents(emailWorker, 'Email');
setupWorkerEvents(notificationWorker, 'Notification');
setupWorkerEvents(imageWorker, 'Image');
setupWorkerEvents(cleanupWorker, 'Cleanup');

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔄 Shutting down job workers...');
  
  try {
    await Promise.all([
      emailWorker.close(),
      notificationWorker.close(),
      imageWorker.close(),
      cleanupWorker.close(),
    ]);
    
    console.log('✅ All job workers closed gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during worker shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception in job worker:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection in job worker:', reason);
  gracefulShutdown();
});

console.log('🚀 Job workers started successfully');
console.log('Workers running:');
console.log('  📧 Email worker');
console.log('  🔔 Notification worker');
console.log('  🖼️  Image processing worker');
console.log('  🧹 Cleanup worker');

export {
  emailWorker,
  notificationWorker,
  imageWorker,
  cleanupWorker,
};