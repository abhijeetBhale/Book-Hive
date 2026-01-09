import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  source: {
    type: String,
    enum: ['lending_fee', 'book_sale', 'platform_commission', 'withdrawal', 'refund', 'penalty', 'admin_adjustment'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true // Can reference BorrowRequest, Book, or other entities
  },
  referenceType: {
    type: String,
    enum: ['BorrowRequest', 'Book', 'User', 'Withdrawal', 'WalletTransaction'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true,
    min: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ userId: 1, source: 1 });
walletTransactionSchema.index({ referenceId: 1, referenceType: 1 });

export default mongoose.model('WalletTransaction', walletTransactionSchema);