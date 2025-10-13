import mongoose from 'mongoose';

const bookClubSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Club name is required'],
        trim: true,
        maxlength: [100, 'Club name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Club description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    coverImage: {
        type: String,
        default: ''
    },
    privacy: {
        type: String,
        enum: ['public', 'private', 'invite-only'],
        default: 'public'
    },
    maxMembers: {
        type: Number,
        default: 50,
        min: [2, 'Club must allow at least 2 members'],
        max: [500, 'Club cannot exceed 500 members']
    },
    currentMemberCount: {
        type: Number,
        default: 1
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    genres: [{
        type: String,
        enum: [
            'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy',
            'Biography', 'History', 'Self-Help', 'Business', 'Health', 'Travel',
            'Cooking', 'Art', 'Poetry', 'Drama', 'Horror', 'Thriller', 'Adventure'
        ]
    }],
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        },
        address: {
            type: String,
            default: 'Virtual Club'
        },
        isVirtual: {
            type: Boolean,
            default: true
        }
    },
    rules: {
        type: String,
        maxlength: [2000, 'Rules cannot exceed 2000 characters'],
        default: 'Be respectful and enjoy reading together!'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    settings: {
        allowDiscussions: {
            type: Boolean,
            default: true
        },
        allowEvents: {
            type: Boolean,
            default: true
        },
        requireApproval: {
            type: Boolean,
            default: false
        },
        allowInvites: {
            type: Boolean,
            default: true
        }
    },
    stats: {
        totalPosts: {
            type: Number,
            default: 0
        },
        totalEvents: {
            type: Number,
            default: 0
        },
        totalBooks: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
bookClubSchema.index({ name: 'text', description: 'text' });
bookClubSchema.index({ genres: 1 });
bookClubSchema.index({ privacy: 1, isActive: 1 });
bookClubSchema.index({ location: '2dsphere' });
bookClubSchema.index({ createdBy: 1 });

// Virtual for member count validation
bookClubSchema.pre('save', function (next) {
    if (this.currentMemberCount > this.maxMembers) {
        return next(new Error('Current member count cannot exceed maximum members'));
    }
    next();
});

const BookClub = mongoose.model('BookClub', bookClubSchema);
export default BookClub;