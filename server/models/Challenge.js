import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Challenge title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Challenge description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    icon: {
        type: String,
        default: '🎯'
    },
    type: {
        type: String,
        enum: ['reading', 'lending', 'community', 'social', 'streak', 'special'],
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'expert'],
        default: 'medium'
    },
    duration: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'seasonal', 'yearly', 'ongoing'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    goals: [{
        metric: {
            type: String,
            enum: [
                'books_read', 'books_lent', 'books_borrowed', 'pages_read',
                'clubs_joined', 'posts_created', 'events_attended', 'friends_made',
                'consecutive_days', 'points_earned', 'reviews_written'
            ],
            required: true
        },
        target: {
            type: Number,
            required: true,
            min: 1
        },
        description: String
    }],
    rewards: {
        points: {
            type: Number,
            default: 0
        },
        badge: String,
        title: String,
        specialReward: String,
        // Tiered rewards based on completion percentage
        tiers: [{
            percentage: {
                type: Number,
                min: 0,
                max: 100
            },
            points: Number,
            badge: String,
            title: String
        }]
    },
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        progress: [{
            metric: String,
            current: {
                type: Number,
                default: 0
            },
            target: Number,
            percentage: {
                type: Number,
                default: 0
            }
        }],
        isCompleted: {
            type: Boolean,
            default: false
        },
        completedAt: Date,
        finalScore: {
            type: Number,
            default: 0
        },
        rank: Number
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isGlobal: {
        type: Boolean,
        default: true // Global challenges vs club-specific
    },
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BookClub' // For club-specific challenges
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    stats: {
        totalParticipants: {
            type: Number,
            default: 0
        },
        completedParticipants: {
            type: Number,
            default: 0
        },
        averageCompletion: {
            type: Number,
            default: 0
        }
    },
    settings: {
        allowLateJoin: {
            type: Boolean,
            default: true
        },
        showLeaderboard: {
            type: Boolean,
            default: true
        },
        autoComplete: {
            type: Boolean,
            default: true
        }
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
challengeSchema.index({ type: 1, isActive: 1 });
challengeSchema.index({ duration: 1, startDate: 1 });
challengeSchema.index({ endDate: 1, isActive: 1 });
challengeSchema.index({ isFeatured: -1, startDate: -1 });
challengeSchema.index({ club: 1, isActive: 1 });
challengeSchema.index({ 'participants.user': 1 });

// Update participant count when participants change
challengeSchema.pre('save', function (next) {
    if (this.isModified('participants')) {
        this.stats.totalParticipants = this.participants.length;
        this.stats.completedParticipants = this.participants.filter(p => p.isCompleted).length;

        if (this.stats.totalParticipants > 0) {
            const totalCompletion = this.participants.reduce((sum, p) => {
                const avgProgress = p.progress.reduce((pSum, prog) => pSum + prog.percentage, 0) / p.progress.length;
                return sum + avgProgress;
            }, 0);
            this.stats.averageCompletion = totalCompletion / this.stats.totalParticipants;
        }
    }
    next();
});

// Method to add participant
challengeSchema.methods.addParticipant = function (userId) {
    const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString());
    if (existingParticipant) {
        throw new Error('User is already participating in this challenge');
    }

    const progress = this.goals.map(goal => ({
        metric: goal.metric,
        current: 0,
        target: goal.target,
        percentage: 0
    }));

    this.participants.push({
        user: userId,
        progress: progress
    });
};

// Method to update participant progress
challengeSchema.methods.updateProgress = function (userId, metric, value) {
    const participant = this.participants.find(p => p.user.toString() === userId.toString());
    if (!participant) {
        throw new Error('User is not participating in this challenge');
    }

    const progressItem = participant.progress.find(p => p.metric === metric);
    if (!progressItem) {
        throw new Error('Invalid metric for this challenge');
    }

    progressItem.current = Math.min(progressItem.target, progressItem.current + value);
    progressItem.percentage = (progressItem.current / progressItem.target) * 100;

    // Check if challenge is completed
    const allCompleted = participant.progress.every(p => p.percentage >= 100);
    if (allCompleted && !participant.isCompleted) {
        participant.isCompleted = true;
        participant.completedAt = new Date();
        participant.finalScore = participant.progress.reduce((sum, p) => sum + p.percentage, 0);
    }
};

const Challenge = mongoose.model('Challenge', challengeSchema);
export default Challenge;