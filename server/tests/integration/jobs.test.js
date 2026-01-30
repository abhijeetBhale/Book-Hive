import { scheduleJob, getQueueStats, JOB_TYPES, emailQueue } from '../../services/jobQueue.js';
import emailJobHandler from '../../workers/handlers/emailJobHandler.js';

// Mock nodemailer for testing
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id',
      accepted: ['test@example.com'],
      rejected: []
    })
  }))
}));

describe('Background Jobs', () => {
  describe('Job Queue Management', () => {
    it('should schedule a job successfully', async () => {
      const jobData = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content'
      };

      const job = await scheduleJob('email', JOB_TYPES.SEND_EMAIL, jobData);

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.data).toEqual(expect.objectContaining(jobData));
    });

    it('should get queue statistics', async () => {
      const stats = await getQueueStats('email');

      expect(stats).toBeDefined();
      expect(stats.name).toBe('email');
      expect(typeof stats.waiting).toBe('number');
      expect(typeof stats.active).toBe('number');
      expect(typeof stats.completed).toBe('number');
      expect(typeof stats.failed).toBe('number');
    });

    it('should handle invalid queue name', async () => {
      await expect(getQueueStats('invalid-queue')).rejects.toThrow('Unknown queue');
    });
  });

  describe('Email Job Handler', () => {
    it('should send email successfully', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content'
      };

      const result = await emailJobHandler.sendEmail(emailData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(result.to).toBe(emailData.to);
      expect(result.subject).toBe(emailData.subject);
    });

    it('should send welcome email', async () => {
      const userData = {
        user: {
          name: 'Test User',
          email: 'test@example.com'
        }
      };

      const result = await emailJobHandler.sendWelcomeEmail(userData);

      expect(result.success).toBe(true);
      expect(result.to).toBe(userData.user.email);
      expect(result.subject).toContain('Welcome');
    });

    it('should send borrow request email', async () => {
      const requestData = {
        bookOwner: {
          name: 'Book Owner',
          email: 'owner@example.com'
        },
        requester: {
          name: 'Book Requester',
          _id: 'requester-id'
        },
        book: {
          title: 'Test Book',
          author: 'Test Author'
        },
        message: 'Can I borrow this book?'
      };

      const result = await emailJobHandler.sendBorrowRequestEmail(requestData);

      expect(result.success).toBe(true);
      expect(result.to).toBe(requestData.bookOwner.email);
      expect(result.subject).toContain('borrow request');
    });

    it('should send reminder email', async () => {
      const reminderData = {
        user: {
          name: 'Test User',
          email: 'test@example.com'
        },
        book: {
          title: 'Test Book',
          author: 'Test Author'
        },
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        type: 'return_reminder'
      };

      const result = await emailJobHandler.sendReminderEmail(reminderData);

      expect(result.success).toBe(true);
      expect(result.to).toBe(reminderData.user.email);
      expect(result.subject).toContain('Reminder');
    });

    it('should send overdue email', async () => {
      const overdueData = {
        user: {
          name: 'Test User',
          email: 'test@example.com'
        },
        book: {
          title: 'Test Book',
          author: 'Test Author'
        },
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        type: 'return_reminder'
      };

      const result = await emailJobHandler.sendOverdueEmail(overdueData);

      expect(result.success).toBe(true);
      expect(result.to).toBe(overdueData.user.email);
      expect(result.subject).toContain('Overdue');
    });
  });

  describe('Job Processing', () => {
    it('should process email job end-to-end', async () => {
      const jobData = {
        to: 'test@example.com',
        subject: 'End-to-End Test',
        html: '<p>Test content</p>',
        text: 'Test content'
      };

      // Schedule the job
      const job = await scheduleJob('email', JOB_TYPES.SEND_EMAIL, jobData);
      expect(job).toBeDefined();

      // Wait for job to be processed (in a real scenario, this would be handled by the worker)
      // For testing, we'll simulate the processing
      const result = await emailJobHandler.sendEmail(jobData);
      expect(result.success).toBe(true);
    });

    it('should handle job failures gracefully', async () => {
      // Mock a failure
      const originalSendMail = require('nodemailer').createTransporter().sendMail;
      require('nodemailer').createTransporter().sendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      const jobData = {
        to: 'test@example.com',
        subject: 'Failure Test',
        html: '<p>Test content</p>',
        text: 'Test content'
      };

      await expect(emailJobHandler.sendEmail(jobData)).rejects.toThrow('Failed to send email');

      // Restore original mock
      require('nodemailer').createTransporter().sendMail = originalSendMail;
    });
  });
});