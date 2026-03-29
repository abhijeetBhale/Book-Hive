import VerificationApplication from '../models/VerificationApplication.js';
import User from '../models/User.js';

/**
 * @desc    Apply for verification badge
 * @route   POST /api/verification/apply
 * @access  Private
 */
export const applyForVerification = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if user already has an application
    const existingApplication = await VerificationApplication.findOne({ user: userId });

    if (existingApplication) {
      if (existingApplication.status === 'pending') {
        return res.status(400).json({ 
          success: false,
          message: 'You already have a pending verification application' 
        });
      }
      if (existingApplication.status === 'approved') {
        return res.status(400).json({ 
          success: false,
          message: 'You are already verified' 
        });
      }
    }

    // Check if user is already verified
    const user = await User.findById(userId);
    if (user.isVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'You are already verified' 
      });
    }

    const applicationData = {
      user: userId,
      ...req.body
    };

    const application = await VerificationApplication.create(applicationData);

    // Populate user data for the notification
    await application.populate('user', 'name email avatar');

    // Notify admins of new verification application
    try {
      const adminNotificationService = req.app.get('adminNotificationService');
      if (adminNotificationService) {
        adminNotificationService.notifyNewVerificationApplication(application);
      }
    } catch (adminNotifError) {
      console.error('Failed to send admin notification for verification application:', adminNotifError);
    }

    res.status(201).json({
      success: true,
      message: 'Verification application submitted successfully. We will review it shortly.',
      data: application
    });
  } catch (error) {
    console.error('Apply for verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit application',
      error: error.message 
    });
  }
};

/**
 * @desc    Get user's verification application status
 * @route   GET /api/verification/status
 * @access  Private
 */
export const getVerificationStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const application = await VerificationApplication.findOne({ user: userId });
    const user = await User.findById(userId).select('isVerified');

    res.json({
      success: true,
      data: {
        isVerified: user.isVerified || false,
        application: application || null
      }
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get verification status',
      error: error.message 
    });
  }
};

export default {
  applyForVerification,
  getVerificationStatus
};
