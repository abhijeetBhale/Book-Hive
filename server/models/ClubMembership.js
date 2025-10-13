import mongoose from 'mongoose';

const clubMembershipSchema = new mongoose.Schema({
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookClub',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'moderator', 'member'],
    default: 'member'
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'banned', 'left'],
    default: 'active'
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: {
    type: Date
  },
  notifications: {
    posts: {
      type: Boolean,
      default: true
    },
    events: {
      type: Boolean,
      default: true
    },
    announcements: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    postsCreated: {
      type: Number,
      default: 0
    },
    eventsAttended: {
      type: Number,
      default: 0
    },
    booksShared: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
clubMembershipSchema.index({ club: 1, user: 1 }, { unique: true });
clubMembershipSchema.index({ user: 1, status: 1 });
clubMembershipSchema.index({ club: 1, role: 1 });
clubMembershipSchema.index({ club: 1, status: 1 });

// Update club member count when membership changes
clubMembershipSchema.post('save', async function() {
  const BookClub = mongoose.model('BookClub');
  const activeCount = await mongoose.model('ClubMembership').countDocuments({
    club: this.club,
    status: 'active'
  });
  
  await BookClub.findByIdAndUpdate(this.club, {
    currentMemberCount: activeCount
  });
});

clubMembershipSchema.post('deleteOne', { document: true }, async function() {
  const BookClub = mongoose.model('BookClub');
  const activeCount = await mongoose.model('ClubMembership').countDocuments({
    club: this.club,
    status: 'active'
  });
  
  await BookClub.findByIdAndUpdate(this.club, {
    currentMemberCount: activeCount
  });
});

const ClubMembership = mongoose.model('ClubMembership', clubMembershipSchema);
export default ClubMembership;