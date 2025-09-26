import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validateEmail, validatePassword } from '../utils/validation.js';
import cloudinary, { uploadToCloudinary } from '../config/cloudinary.js';

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
    const user = await User.findById(req.user.id);
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
// THE DEFINITIVE FIX: This function now correctly handles file uploads and saves the URL.
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prepare data for update
    user.name = name || user.name;
    user.email = email || user.email;

    // 1. Check if a new avatar file was uploaded
    if (req.file) {
      // 2. Upload the new file to your cloud service (e.g., Cloudinary)
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'bookhive_avatars',
        width: 200,
        height: 200,
        crop: 'fill',
        gravity: 'face',
        resource_type: 'image'
      });
      // 3. CRITICAL STEP: Assign the new, permanent URL to the user object.
      user.avatar = result.secure_url;
    }

    // 4. Save the updated user object (with the new avatar URL) to the database.
    const updatedUser = await user.save();

    // 5. Send back the complete, saved user object.
    res.status(200).json({
      success: true,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        // include other fields you need on the frontend
      },
    });
  } catch (error)    {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};


// @desc    Update user location
// @route   PUT /api/auth/location
export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const user = await User.findById(req.user.id);

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