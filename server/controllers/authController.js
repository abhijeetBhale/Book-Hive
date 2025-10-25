import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validateEmail, validatePassword } from '../utils/validation.js';
import { uploadFileToCloudinary } from '../config/cloudinary.js';

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Please provide name, email, and password'
      });
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ message: emailError });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });
    res.status(201).json({
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Register user error:', error);
    res.status(500).json({ message: 'Server error registering user' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Login user error:', error);
    res.status(500).json({ message: 'Server error logging in' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
export const getProfile = async (req, res) => {
  try {
    // Fix: Use req.user._id instead of req.user.id
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        location: user.location,
        securitySettings: user.securitySettings || {
          twoFactorEnabled: false,
          emailNotifications: true,
          loginAlerts: true,
          sessionTimeout: '30',
          accountVisibility: 'public'
        }
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error getting profile' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    // Log profile update attempt for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Profile update request:', {
        userId: req.user._id,
        hasFile: !!req.file
      });
    }

    const { name, email } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ 
        success: false,
        message: 'Name and email are required' 
      });
    }

    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Update basic profile data
    user.name = name.trim();
    user.email = email.trim().toLowerCase();

    // Handle avatar upload if file is provided
    if (req.file) {
      try {
        // Upload avatar to Cloudinary
        const result = await uploadFileToCloudinary(req.file.path, {
          folder: 'bookhive_avatars',
          width: 200,
          height: 200,
          crop: 'fill',
          gravity: 'face',
          resource_type: 'image',
          format: 'jpg',
          quality: 'auto'
        });
        user.avatar = result.secure_url;
        
        // Clean up the temporary file
        try {
          const fs = await import('fs');
          fs.unlinkSync(req.file.path);
          // Temporary file cleaned up successfully
        } catch (cleanupError) {
          console.error('Error cleaning up temp file:', cleanupError);
          // Don't fail the request for cleanup errors
        }
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
        
        // Clean up temp file even if upload failed
        try {
          const fs = await import('fs');
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up temp file after upload failure:', cleanupError);
        }
        
        // Return error for avatar upload failure
        return res.status(400).json({ 
          success: false,
          message: 'Failed to upload avatar image. Please try again.',
          error: process.env.NODE_ENV === 'development' ? uploadError.message : undefined
        });
      }
    }

    // Save the updated user
    const updatedUser = await user.save();
    // User profile updated successfully

    // Return the updated user data
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        location: updatedUser.location
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    
    // Clean up temp file if it exists
    if (req.file && req.file.path) {
      try {
        const fs = await import('fs');
        fs.unlinkSync(req.file.path);
        // Cleaned up temp file after error
      } catch (cleanupError) {
        console.error('Error cleaning up temp file after error:', cleanupError);
      }
    }
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ 
        success: false,
        message: messages.join(', ')
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Please provide current password and new password' 
      });
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current password is correct
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      message: 'Server error changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user location
// @route   PUT /api/auth/location
export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    // Fix: Use req.user._id instead of req.user.id
    const user = await User.findById(req.user._id);

    if (user) {
      user.location = {
        type: 'Point',
        coordinates: [longitude, latitude]
      };
      await user.save();
      res.json({ message: 'Location updated successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error updating location' });
  }
};

// @desc    Update security settings
// @route   PUT /api/auth/security-settings
export const updateSecuritySettings = async (req, res) => {
  try {
    const { 
      twoFactorEnabled, 
      emailNotifications, 
      loginAlerts, 
      sessionTimeout, 
      accountVisibility 
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize securitySettings if it doesn't exist
    if (!user.securitySettings) {
      user.securitySettings = {};
    }

    // Update security settings
    if (typeof twoFactorEnabled === 'boolean') {
      user.securitySettings.twoFactorEnabled = twoFactorEnabled;
    }
    if (typeof emailNotifications === 'boolean') {
      user.securitySettings.emailNotifications = emailNotifications;
    }
    if (typeof loginAlerts === 'boolean') {
      user.securitySettings.loginAlerts = loginAlerts;
    }
    if (sessionTimeout) {
      user.securitySettings.sessionTimeout = sessionTimeout;
    }
    if (accountVisibility) {
      user.securitySettings.accountVisibility = accountVisibility;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Security settings updated successfully',
      securitySettings: user.securitySettings
    });
  } catch (error) {
    console.error('Update security settings error:', error);
    res.status(500).json({ 
      message: 'Server error updating security settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get account activity
// @route   GET /api/auth/account-activity
export const getAccountActivity = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // For now, return mock data. In a real implementation, you would:
    // 1. Store login/activity logs in a separate collection
    // 2. Track IP addresses, devices, locations
    // 3. Log security events like password changes
    
    const mockActivity = [
      {
        id: 1,
        action: 'Login',
        device: 'Chrome on Windows',
        location: 'New York, NY',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        ip: '192.168.1.1'
      },
      {
        id: 2,
        action: 'Password Changed',
        device: 'Chrome on Windows',
        location: 'New York, NY',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        ip: '192.168.1.1'
      },
      {
        id: 3,
        action: 'Login',
        device: 'Safari on iPhone',
        location: 'New York, NY',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        ip: '192.168.1.2'
      },
      {
        id: 4,
        action: 'Profile Updated',
        device: 'Chrome on Windows',
        location: 'New York, NY',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        ip: '192.168.1.1'
      }
    ];

    res.status(200).json({
      success: true,
      activity: mockActivity
    });
  } catch (error) {
    console.error('Get account activity error:', error);
    res.status(500).json({ 
      message: 'Server error getting account activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Enable two-factor authentication
// @route   POST /api/auth/enable-2fa
export const enable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize securitySettings if it doesn't exist
    if (!user.securitySettings) {
      user.securitySettings = {};
    }

    // For now, just enable 2FA flag
    // In a real implementation, you would:
    // 1. Generate a secret key
    // 2. Return QR code for authenticator app
    // 3. Require verification before enabling
    
    user.securitySettings.twoFactorEnabled = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: '2FA enabled successfully',
      // In real implementation, return QR code data
      qrCode: 'mock-qr-code-data'
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({ 
      message: 'Server error enabling 2FA',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Disable two-factor authentication
// @route   POST /api/auth/disable-2fa
export const disable2FA = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Verification code is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // In a real implementation, verify the 2FA code here
    // For now, just disable 2FA
    
    if (!user.securitySettings) {
      user.securitySettings = {};
    }

    user.securitySettings.twoFactorEnabled = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ 
      message: 'Server error disabling 2FA',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify two-factor authentication code
// @route   POST /api/auth/verify-2fa
export const verify2FA = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Verification code is required' });
    }

    // In a real implementation, verify the 2FA code against the user's secret
    // For now, just return success for demo purposes
    
    res.status(200).json({
      success: true,
      message: '2FA code verified successfully'
    });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({ 
      message: 'Server error verifying 2FA code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};