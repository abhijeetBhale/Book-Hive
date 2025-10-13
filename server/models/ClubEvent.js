import mongoose from 'mongoose';

const clubEventSchema = new mongoose.Schema({
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookClub',
    required: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  eventType: {
    type: String,
    enum: ['meeting', 'book-discussion', 'reading-session', 'social', 'workshop'],
    default: 'meeting'
  },
  eventDate: {
    type: Date,
    required: [true, 'Event date is required']
  },
  duration: {
    type: Number, // Duration in minutes
    default: 60
  },
  location: {
    type: {
      type: String,
      enum: ['virtual', 'physical'],
      default: 'virtual'
    },
    address: String,
    coordinates: [Number], // [longitude, latitude]
    meetingLink: String, // For virtual events
    platform: {
      type: String,
      enum: ['zoom', 'meet', 'teams', 'discord', 'other'],
      default: 'zoom'
    }
  },
  maxAttendees: {
    type: Number,
    default: 20
  },
  currentAttendees: {
    type: Number,
    default: 0
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['going', 'maybe', 'not-going'],
      default: 'going'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  relatedBook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  },
  agenda: [{
    item: String,
    duration: Number, // minutes
    presenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['link', 'document', 'video', 'image']
    }
  }],
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrence: {
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly']
    },
    endDate: Date,
    daysOfWeek: [Number] // 0-6, Sunday = 0
  },
  reminders: {
    sent24h: {
      type: Boolean,
      default: false
    },
    sent1h: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
clubEventSchema.index({ club: 1, eventDate: 1 });
clubEventSchema.index({ organizer: 1 });
clubEventSchema.index({ eventDate: 1, status: 1 });
clubEventSchema.index({ 'attendees.user': 1 });

// Update club stats when event is created
clubEventSchema.post('save', async function() {
  if (this.isNew) {
    const BookClub = mongoose.model('BookClub');
    await BookClub.findByIdAndUpdate(this.club, {
      $inc: { 'stats.totalEvents': 1 }
    });
  }
});

// Update attendee count when attendees change
clubEventSchema.pre('save', function(next) {
  if (this.isModified('attendees')) {
    this.currentAttendees = this.attendees.filter(a => a.status === 'going').length;
  }
  next();
});

const ClubEvent = mongoose.model('ClubEvent', clubEventSchema);
export default ClubEvent;