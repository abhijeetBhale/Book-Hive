import mongoose from 'mongoose';

const lendingSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  borrowerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lenderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  borrowRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BorrowRequest',
    required: true,
    unique: true // One lending record per borrow request
  },
  fee: {
    type: Number,
    required: true,
    min: 0
  },
  platformFee: {
    type: Number,
    required: true,
    min: 0
  },
  lenderEarnings: {
    type: Number,
    required: true,
    min: 0
  },
  isPaid: {
    type: Boolean,
    default: false,
    index: true
  },
  paymentId: {
    type: String,
    sparse: true // Only set when payment is made
  },
  paidAt: {
    type: Date,
    sparse: true
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.2 // 20% platform commission
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
lendingSchema.index({ borrowerId: 1, isPaid: 1 });
lendingSchema.index({ lenderId: 1, isPaid: 1 });
lendingSchema.index({ isPaid: 1, createdAt: -1 });

export default mongoose.model('Lending', lendingSchema);