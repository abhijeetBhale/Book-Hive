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
        location: user.location
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