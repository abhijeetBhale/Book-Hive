import mongoose from 'mongoose';

const eventRegistrationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Snapshot of user data at registration time (for organizer access)
  userSnapshot: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      default: ''
    }
  },
  // Custom registration data based on event's registration fields
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  consentGiven: {
    type: Boolean,
    required: true,
    default: false
  },
  status: {
    type: String,
    enum: ['registered', 'attended', 'cancelled', 'no-show'],
    default: 'registered'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  cancelledAt: {
    type: Date
  },
  attendedAt: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  },
  // For organizer notes
  organizerNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes
eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true }); // One registration per user per event
eventRegistrationSchema.index({ event: 1, status: 1 });
eventRegistrationSchema.index({ user: 1 });

// Update event registration count when registration is created
eventRegistrationSchema.post('save', async function() {
  if (this.isNew && this.status === 'registered') {
    const Event = mongoose.model('Event');
    await Event.findByIdAndUpdate(this.event, {
      $inc: { currentRegistrations: 1 }
    });
  }
});

// Update event registration count when registration status changes
eventRegistrationSchema.pre('save', async function(next) {
  if (!this.isNew && this.isModified('status')) {
    try {
      const Event = mongoose.model('Event');
      
      // Get the original document to compare status
      const original = await this.constructor.findById(this._id).lean();
      
      if (original) {
        // If changing from registered to cancelled, decrement count
        if (original.status === 'registered' && this.status === 'cancelled') {
          await Event.findByIdAndUpdate(this.event, {
            $inc: { currentRegistrations: -1 }
          });
        } 
        // If changing from cancelled to registered, increment count
        else if (original.status === 'cancelled' && this.status === 'registered') {
          await Event.findByIdAndUpdate(this.event, {
            $inc: { currentRegistrations: 1 }
          });
        }
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const EventRegistration = mongoose.model('EventRegistration', eventRegistrationSchema);
export default EventRegistration;
