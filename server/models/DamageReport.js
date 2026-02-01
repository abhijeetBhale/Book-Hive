import mongoose from 'mongoose';

const damageReportSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book reference is required'],
    index: true
  },
  borrowRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BorrowRequest',
    required: [true, 'Borrow request reference is required'],
    index: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter is required'],
    index: true
  },
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Borrower reference is required'],
    index: true
  },
  severity: {
    type: String,
    enum: ['minor', 'moderate', 'severe'],
    required: [true, 'Damage severity is required'],
    index: true
  },
  description: {
    type: String,
    required: [true, 'Damage description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  autoPenaltyAmount: {
    type: Number,
    required: [true, 'Auto penalty amount is required'],
    min: [0, 'Penalty amount cannot be negative']
  },
  finalPenaltyAmount: {
    type: Number,
    default: null,
    min: [0, 'Final penalty amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'disputed', 'resolved', 'cancelled'],
    default: 'pending',
    index: true
  },
  borrowerResponse: {
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Response message cannot exceed 500 characters']
    },
    respondedAt: {
      type: Date
    },
    action: {
      type: String,
      enum: ['accept', 'dispute']
    }
  },
  adminReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    decision: {
      type: String,
      enum: ['uphold', 'reduce', 'dismiss']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin notes cannot exceed 500 characters']
    },
    adjustedAmount: {
      type: Number,
      min: [0, 'Adjusted amount cannot be negative']
    }
  },
  // Auto-resolution settings
  autoResolveAt: {
    type: Date,
    index: true
  },
  isAutoResolved: {
    type: Boolean,
    default: false
  },
  // Metadata for tracking
  metadata: {
    bookConditionBefore: {
      type: String,
      enum: ['new', 'good', 'worn']
    },
    bookConditionAfter: {
      type: String,
      enum: ['new', 'good', 'worn']
    },
    penaltyCalculationDetails: {
      baseCondition: String,
      damageSeverity: String,
      depositAmount: Number,
      penaltyPercentage: Number,
      calculatedAmount: Number
    }
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
damageReportSchema.index({ book: 1, borrowRequest: 1 }, { unique: true }); // Prevent duplicate reports
damageReportSchema.index({ reportedBy: 1, status: 1 });
damageReportSchema.index({ borrower: 1, status: 1 });
damageReportSchema.index({ createdAt: -1 });
damageReportSchema.index({ autoResolveAt: 1 }, { sparse: true });

// Pre-save middleware to set auto-resolve date
damageReportSchema.pre('save', function(next) {
  if (this.isNew && this.status === 'pending') {
    // Auto-resolve after 7 days if no response
    this.autoResolveAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  next();
});

// Instance method to check if report can be disputed
damageReportSchema.methods.canBeDisputed = function() {
  return this.status === 'pending' && new Date() < this.autoResolveAt;
};

// Instance method to auto-resolve if time expired
damageReportSchema.methods.autoResolveIfExpired = function() {
  if (this.status === 'pending' && new Date() >= this.autoResolveAt) {
    this.status = 'resolved';
    this.isAutoResolved = true;
    this.finalPenaltyAmount = this.autoPenaltyAmount;
    return true;
  }
  return false;
};

// Static method to find reports ready for auto-resolution
damageReportSchema.statics.findExpiredReports = function() {
  return this.find({
    status: 'pending',
    autoResolveAt: { $lte: new Date() },
    isAutoResolved: false
  });
};

const DamageReport = mongoose.model('DamageReport', damageReportSchema);
export default DamageReport;