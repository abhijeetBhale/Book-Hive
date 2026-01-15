import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Organizer is required']
  },
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  eventType: {
    type: String,
    enum: ['workshop', 'book-reading', 'author-meetup', 'book-club', 'literary-festival', 'book-launch', 'discussion', 'other'],
    default: 'other'
  },
  startAt: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endAt: {
    type: Date,
    required: [true, 'End date is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    venue: {
      type: String,
      default: ''
    }
  },
  capacity: {
    type: Number,
    default: 0, // 0 means unlimited
    min: 0
  },
  currentRegistrations: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  registrationRequired: {
    type: Boolean,
    default: false
  },
  registrationFields: [{
    fieldName: {
      type: String,
      required: true
    },
    fieldType: {
      type: String,
      enum: ['text', 'email', 'phone', 'number', 'textarea', 'select', 'checkbox'],
      default: 'text'
    },
    label: {
      type: String,
      required: true
    },
    placeholder: String,
    required: {
      type: Boolean,
      default: false
    },
    options: [String], // For select fields
    order: {
      type: Number,
      default: 0
    }
  }],
  images: [{
    url: String,
    publicId: String
  }],
  coverImage: {
    url: String,
    publicId: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  externalLink: {
    type: String,
    default: ''
  },
  contactEmail: {
    type: String,
    default: ''
  },
  contactPhone: {
    type: String,
    default: ''
  },
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  // Moderation
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  // Cancellation tracking
  cancellationReason: {
    type: String,
    default: ''
  },
  cancelledAt: {
    type: Date
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
eventSchema.index({ location: '2dsphere' }); // Geospatial queries
eventSchema.index({ organizer: 1, status: 1 });
eventSchema.index({ startAt: 1, status: 1 });
eventSchema.index({ status: 1, isPublic: 1 });
eventSchema.index({ tags: 1 });

// Validate end date is after start date
eventSchema.pre('save', function(next) {
  if (this.endAt <= this.startAt) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Update status to completed if event has ended (commented out to keep events visible)
// eventSchema.pre('save', function(next) {
//   if (this.status === 'published' && this.endAt < new Date()) {
//     this.status = 'completed';
//   }
//   next();
// });

const Event = mongoose.model('Event', eventSchema);
export default Event;
