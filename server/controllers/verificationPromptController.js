import User from '../models/User.js';
import { isProfileComplete } from '../utils/profileCompletionChecker.js';

// @desc    Get verification prompt status
// @route   GET /api/users/verification-prompt/status
// @access  Private
export const getVerificationPromptStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('isVerified verificationPrompt avatar location booksOwned name email')
      .populate('booksOwned', '_id');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If user is verified, they shouldn't see any prompts
    if (user.isVerified) {
      return res.json({
        success: true,
        data: {
          shouldShowFloatingPopup: false,
          shouldShowNotification: false,
          isVerified: true
        }
      });
    }

    // Check if profile is complete using comprehensive checker
    const profileStatus = isProfileComplete(user);
    const hasCompletedProfileSetup = profileStatus.isComplete;

    // Determine if floating popup should be shown
    const shouldShowFloatingPopup = 
      !user.verificationPrompt?.hasSeenFloatingPopup &&
      !user.verificationPrompt?.permanentlyDismissed &&
      hasCompletedProfileSetup;

    // Notification should always be shown for unverified users (unless permanently dismissed)
    const shouldShowNotification = 
      !user.isVerified && 
      !user.verificationPrompt?.permanentlyDismissed;

    res.json({
      success: true,
      data: {
        shouldShowFloatingPopup,
        shouldShowNotification,
        isVerified: false,
        hasSeenFloatingPopup: user.verificationPrompt?.hasSeenFloatingPopup || false,
        permanentlyDismissed: user.verificationPrompt?.permanentlyDismissed || false,
        hasCompletedProfileSetup,
        profileCompletion: profileStatus
      }
    });
  } catch (error) {
    console.error('Get verification prompt status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification prompt status',
      error: error.message
    });
  }
};

// @desc    Mark floating popup as seen (temporary dismiss with X button)
// @route   POST /api/users/verification-prompt/seen
// @access  Private
export const markFloatingPopupSeen = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize verificationPrompt if it doesn't exist
    if (!user.verificationPrompt) {
      user.verificationPrompt = {};
    }

    // Mark as seen (will show again on next login)
    user.verificationPrompt.hasSeenFloatingPopup = true;
    user.verificationPrompt.dismissedAt = new Date();
    user.verificationPrompt.showCount = (user.verificationPrompt.showCount || 0) + 1;

    await user.save();

    res.json({
      success: true,
      message: 'Floating popup marked as seen',
      data: {
        showCount: user.verificationPrompt.showCount
      }
    });
  } catch (error) {
    console.error('Mark floating popup seen error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark popup as seen',
      error: error.message
    });
  }
};

// @desc    Permanently dismiss verification prompt (Don't show again)
// @route   POST /api/users/verification-prompt/dismiss-permanently
// @access  Private
export const dismissPermanently = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize verificationPrompt if it doesn't exist
    if (!user.verificationPrompt) {
      user.verificationPrompt = {};
    }

    // Permanently dismiss
    user.verificationPrompt.permanentlyDismissed = true;
    user.verificationPrompt.hasSeenFloatingPopup = true;
    user.verificationPrompt.dismissedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'Verification prompt permanently dismissed'
    });
  } catch (error) {
    console.error('Dismiss permanently error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dismiss permanently',
      error: error.message
    });
  }
};

// @desc    Mark profile setup as completed
// @route   POST /api/users/verification-prompt/profile-setup-completed
// @access  Private
export const markProfileSetupCompleted = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize verificationPrompt if it doesn't exist
    if (!user.verificationPrompt) {
      user.verificationPrompt = {};
    }

    // Mark profile setup as completed
    user.verificationPrompt.hasCompletedProfileSetup = true;

    await user.save();

    res.json({
      success: true,
      message: 'Profile setup marked as completed'
    });
  } catch (error) {
    console.error('Mark profile setup completed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark profile setup as completed',
      error: error.message
    });
  }
};

// @desc    Reset floating popup flag (for next login)
// @route   POST /api/users/verification-prompt/reset-popup
// @access  Private
export const resetFloatingPopupFlag = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize verificationPrompt if it doesn't exist
    if (!user.verificationPrompt) {
      user.verificationPrompt = {};
    }

    // Reset the flag so popup can show again on next login
    user.verificationPrompt.hasSeenFloatingPopup = false;

    await user.save();

    res.json({
      success: true,
      message: 'Floating popup flag reset for next login'
    });
  } catch (error) {
    console.error('Reset floating popup flag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset popup flag',
      error: error.message
    });
  }
};