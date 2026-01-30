import { Queue, Worker } from 'bullmq';
import redisClient from '../config/redis.js';

// Job queues - will be initialized after Redis connection
let emailQueue, notificationQueue, imageProcessingQueue, cleanupQueue;
let queuesInitialized = false;

// Initialize queues
export const initializeQueues = async () => {
  try {
    // Check if Redis is connected
    if (!redisClient.isConnected || !redisClient.client) {
      console.log('⚠️  Redis not connected, skipping job queue initialization');
      return false;
    }

    // Use the existing Redis client connection
    const connection = redisClient.client;
    
    emailQueue = new Queue('email', {
      connection,
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50,      // Keep last 50 failed jobs
        attempts: 3,           // Retry failed jobs 3 times
        backoff: {
          type: 'exponential',
          delay: 2000,         // Start with 2 second delay
        },
      },
    });

    notificationQueue = new Queue('notification', {
      connection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });

    imageProcessingQueue = new Queue('image-processing', {
      connection,
      defaultJobOptions: {
        removeOnComplete: 20,
        removeOnFail: 10,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    });

    cleanupQueue = new Queue('cleanup', {
      connection,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 1,
      },
    });

    queuesInitialized = true;
    console.log('✅ Job queues initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize job queues:', error.message);
    console.log('⚠️  Job queues will be disabled');
    queuesInitialized = false;
    return false;
  }
};

// Job types
export const JOB_TYPES = {
  // Email jobs
  SEND_EMAIL: 'send-email',
  SEND_WELCOME_EMAIL: 'send-welcome-email',
  SEND_BORROW_REQUEST_EMAIL: 'send-borrow-request-email',
  SEND_REMINDER_EMAIL: 'send-reminder-email',
  SEND_OVERDUE_EMAIL: 'send-overdue-email',
  
  // Notification jobs
  SEND_PUSH_NOTIFICATION: 'send-push-notification',
  SEND_SOCKET_NOTIFICATION: 'send-socket-notification',
  
  // Image processing jobs
  OPTIMIZE_IMAGE: 'optimize-image',
  GENERATE_THUMBNAILS: 'generate-thumbnails',
  
  // Cleanup jobs
  CLEANUP_EXPIRED_TOKENS: 'cleanup-expired-tokens',
  CLEANUP_OLD_NOTIFICATIONS: 'cleanup-old-notifications',
  CLEANUP_TEMP_FILES: 'cleanup-temp-files',
};

// Job scheduling helpers
export const scheduleJob = async (queueName, jobType, data, options = {}) => {
  try {
    if (!queuesInitialized) {
      console.log('⚠️  Job queues not initialized, skipping job scheduling');
      return null;
    }
    
    const queue = getQueue(queueName);
    const job = await queue.add(jobType, data, {
      ...options,
      // Add job metadata
      timestamp: new Date().toISOString(),
      source: 'api',
    });
    
    console.log(`📋 Job scheduled: ${jobType} (ID: ${job.id})`);
    return job;
  } catch (error) {
    console.error(`❌ Failed to schedule job ${jobType}:`, error);
    throw error;
  }
};

export const scheduleDelayedJob = async (queueName, jobType, data, delay, options = {}) => {
  if (!queuesInitialized) {
    console.log('⚠️  Job queues not initialized, skipping delayed job scheduling');
    return null;
  }
  return scheduleJob(queueName, jobType, data, {
    ...options,
    delay, // Delay in milliseconds
  });
};

export const scheduleRecurringJob = async (queueName, jobType, data, cronPattern, options = {}) => {
  if (!queuesInitialized) {
    console.log('⚠️  Job queues not initialized, skipping recurring job scheduling');
    return null;
  }
  return scheduleJob(queueName, jobType, data, {
    ...options,
    repeat: {
      pattern: cronPattern,
    },
  });
};

// Queue management
export const getQueue = (queueName) => {
  if (!queuesInitialized) {
    throw new Error('Job queues not initialized');
  }
  
  const queues = {
    email: emailQueue,
    notification: notificationQueue,
    'image-processing': imageProcessingQueue,
    cleanup: cleanupQueue,
  };
  
  const queue = queues[queueName];
  if (!queue) {
    throw new Error(`Unknown queue: ${queueName}`);
  }
  
  return queue;
};

export const getQueueStats = async (queueName) => {
  try {
    if (!queuesInitialized) {
      return {
        name: queueName,
        error: 'Job queues not initialized',
      };
    }
    
    const queue = getQueue(queueName);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);
    
    return {
      name: queueName,
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  } catch (error) {
    console.error(`Error getting stats for queue ${queueName}:`, error);
    return {
      name: queueName,
      error: error.message,
    };
  }
};

export const getAllQueueStats = async () => {
  const queueNames = ['email', 'notification', 'image-processing', 'cleanup'];
  const stats = await Promise.all(
    queueNames.map(name => getQueueStats(name))
  );
  
  return stats;
};

// Job utilities
export const getJobById = async (queueName, jobId) => {
  try {
    if (!queuesInitialized) {
      return null;
    }
    const queue = getQueue(queueName);
    return await queue.getJob(jobId);
  } catch (error) {
    console.error(`Error getting job ${jobId} from queue ${queueName}:`, error);
    return null;
  }
};

export const retryFailedJobs = async (queueName) => {
  try {
    if (!queuesInitialized) {
      console.log('⚠️  Job queues not initialized, cannot retry failed jobs');
      return 0;
    }
    
    const queue = getQueue(queueName);
    const failedJobs = await queue.getFailed();
    
    for (const job of failedJobs) {
      await job.retry();
    }
    
    console.log(`🔄 Retried ${failedJobs.length} failed jobs in queue ${queueName}`);
    return failedJobs.length;
  } catch (error) {
    console.error(`Error retrying failed jobs in queue ${queueName}:`, error);
    throw error;
  }
};

export const clearQueue = async (queueName, status = 'completed') => {
  try {
    if (!queuesInitialized) {
      console.log('⚠️  Job queues not initialized, cannot clear queue');
      return;
    }
    
    const queue = getQueue(queueName);
    await queue.clean(0, status);
    console.log(`🧹 Cleared ${status} jobs from queue ${queueName}`);
  } catch (error) {
    console.error(`Error clearing queue ${queueName}:`, error);
    throw error;
  }
};

// Graceful shutdown
export const closeQueues = async () => {
  try {
    if (!queuesInitialized) {
      console.log('⚠️  Job queues not initialized, nothing to close');
      return;
    }
    
    await Promise.all([
      emailQueue?.close(),
      notificationQueue?.close(),
      imageProcessingQueue?.close(),
      cleanupQueue?.close(),
    ]);
    console.log('✅ All job queues closed gracefully');
  } catch (error) {
    console.error('❌ Error closing job queues:', error);
  }
};

// Health check
export const getQueuesHealth = async () => {
  try {
    if (!queuesInitialized) {
      return {
        healthy: false,
        error: 'Job queues not initialized',
        timestamp: new Date().toISOString(),
      };
    }
    
    const stats = await getAllQueueStats();
    const isHealthy = stats.every(stat => !stat.error);
    
    return {
      healthy: isHealthy,
      queues: stats,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

export default {
  initializeQueues,
  emailQueue: () => emailQueue,
  notificationQueue: () => notificationQueue,
  imageProcessingQueue: () => imageProcessingQueue,
  cleanupQueue: () => cleanupQueue,
  JOB_TYPES,
  scheduleJob,
  scheduleDelayedJob,
  scheduleRecurringJob,
  getQueue,
  getQueueStats,
  getAllQueueStats,
  getJobById,
  retryFailedJobs,
  clearQueue,
  closeQueues,
  getQueuesHealth,
};