import mongoose from 'mongoose';

const clubPostSchema = new mongoose.Schema({
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookClub',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  postType: {
    type: String,
    enum: ['discussion', 'announcement', 'poll', 'book-review', 'event'],
    default: 'discussion'
  },
  images: [{
    type: String // Cloudinary URLs
  }],
  attachedBook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  },
  poll: {
    question: String,
    options: [{
      text: String,
      votes: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        votedAt: {
          type: Date,
          default: Date.now
        }
      }]
    }],
    allowMultiple: {
      type: Boolean,
      default: false
    },
    endsAt: Date
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry'],
      default: 'like'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    reactions: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      type: {
        type: String,
        enum: ['like', 'love', 'laugh'],
        default: 'like'
      }
    }]
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
clubPostSchema.index({ club: 1, createdAt: -1 });
clubPostSchema.index({ author: 1 });
clubPostSchema.index({ postType: 1 });
clubPostSchema.index({ isPinned: -1, createdAt: -1 });

// Update club stats when post is created
clubPostSchema.post('save', async function() {
  if (this.isNew) {
    const BookClub = mongoose.model('BookClub');
    await BookClub.findByIdAndUpdate(this.club, {
      $inc: { 'stats.totalPosts': 1 }
    });
  }
});

const ClubPost = mongoose.model('ClubPost', clubPostSchema);
export default ClubPost;