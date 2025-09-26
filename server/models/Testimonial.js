import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  review: {
    type: String,
    required: [true, 'Review is required'],
    maxlength: [500, 'Review cannot exceed 500 characters']
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
testimonialSchema.index({ isApproved: 1, isPublished: 1 });
testimonialSchema.index({ user: 1 });

const Testimonial = mongoose.model('Testimonial', testimonialSchema);
export default Testimonial;