import Testimonial from '../models/Testimonial.js';
import User from '../models/User.js';

// @desc    Create a new testimonial
// @route   POST /api/testimonials
export const createTestimonial = async (req, res) => {
  try {
    const { name, title, review, rating } = req.body;

    // Validate required fields
    if (!name || !title || !review || !rating) {
      return res.status(400).json({ 
        message: 'All fields (name, title, review, rating) are required' 
      });
    }

    // Validate rating
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ 
        message: 'Rating must be a number between 1 and 5' 
      });
    }

    // Check if user already has a testimonial
    const existingTestimonial = await Testimonial.findOne({ user: req.user._id });
    if (existingTestimonial) {
      return res.status(400).json({ 
        message: 'You have already submitted a testimonial. You can update it from your profile.' 
      });
    }

    const testimonial = new Testimonial({
      user: req.user._id,
      name: name.trim(),
      title: title.trim(),
      review: review.trim(),
      rating: ratingNum,
      // For development: auto-approve testimonials
      // In production, you might want to set these to false and have an admin approval process
      isApproved: true,
      isPublished: true
    });

    await testimonial.save();

    res.status(201).json({
      message: 'Testimonial submitted and published successfully!',
      testimonial
    });
  } catch (error) {
    console.error('Create testimonial error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error creating testimonial' });
  }
};

// @desc    Get all published testimonials
// @route   GET /api/testimonials
export const getPublishedTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ 
      isApproved: true, 
      isPublished: true 
    })
    .populate('user', 'avatar')
    .sort({ createdAt: -1 })
    .limit(20);

    // Format testimonials for frontend
    const formattedTestimonials = testimonials.map(testimonial => ({
      user: testimonial.name,
      title: testimonial.title,
      review: testimonial.review,
      rating: testimonial.rating,
      avatar: testimonial.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=4F46E5&color=ffffff&bold=true`,
      createdAt: testimonial.createdAt
    }));

    res.json(formattedTestimonials);
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({ message: 'Server error getting testimonials' });
  }
};

// @desc    Get user's testimonial
// @route   GET /api/testimonials/my-testimonial
export const getUserTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findOne({ user: req.user._id });
    
    if (!testimonial) {
      return res.status(404).json({ message: 'No testimonial found' });
    }

    res.json(testimonial);
  } catch (error) {
    console.error('Get user testimonial error:', error);
    res.status(500).json({ message: 'Server error getting testimonial' });
  }
};

// @desc    Update user's testimonial
// @route   PUT /api/testimonials/my-testimonial
export const updateUserTestimonial = async (req, res) => {
  try {
    const { name, title, review, rating } = req.body;

    const testimonial = await Testimonial.findOne({ user: req.user._id });
    
    if (!testimonial) {
      return res.status(404).json({ message: 'No testimonial found to update' });
    }

    // Update testimonial and reset approval status
    testimonial.name = name.trim();
    testimonial.title = title.trim();
    testimonial.review = review.trim();
    testimonial.rating = parseInt(rating);
    testimonial.isApproved = false; // Reset approval when updated
    testimonial.isPublished = false; // Reset published status

    await testimonial.save();

    res.json({
      message: 'Testimonial updated successfully! It will be reviewed again before publishing.',
      testimonial
    });
  } catch (error) {
    console.error('Update testimonial error:', error);
    res.status(500).json({ message: 'Server error updating testimonial' });
  }
};

// @desc    Delete user's testimonial
// @route   DELETE /api/testimonials/my-testimonial
export const deleteUserTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findOneAndDelete({ user: req.user._id });
    
    if (!testimonial) {
      return res.status(404).json({ message: 'No testimonial found to delete' });
    }

    res.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json({ message: 'Server error deleting testimonial' });
  }
};