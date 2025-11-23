import mongoose from 'mongoose';

const organizerApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  organizationName: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true
  },
  organizationType: {
    type: String,
    enum: ['community', 'library', 'bookstore', 'educational', 'other'],
    required: [true, 'Organization type is required']
  },
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required']
  },
  contactPhone: {
    type: String,
    required: [true, 'Contact phone is required']
  },
  website: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  verificationDocuments: [{
    url: String,
    publicId: String,
    name: String
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  adminNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes
organizerApplicationSchema.index({ user: 1 });
organizerApplicationSchema.index({ status: 1, createdAt: -1 });

const OrganizerApplication = mongoose.model('OrganizerApplication', organizerApplicationSchema);
export default OrganizerApplication;
