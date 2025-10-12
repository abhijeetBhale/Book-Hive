import mongoose from 'mongoose'

const borrowRequestSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied', 'borrowed', 'returned', 'overdue'],
    default: 'pending'
  },
  dueDate: {
    type: Date
  },
  remindersSent: {
    type: Number,
    default: 0
  },
  lastReminderDate: {
    type: Date
  },
  communicationStarted: {
    type: Boolean,
    default: false
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  }
}, {
  timestamps: true
})

borrowRequestSchema.pre('save', async function(next) {
  if (this.isModified('status')) {
    const Book = mongoose.model('Book')
    if (this.status === 'borrowed') {
      await Book.findByIdAndUpdate(this.book, { isAvailable: false });
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 14-day loan period
      this.dueDate = dueDate;
    } else if (this.status === 'returned' || this.status === 'denied') {
      await Book.findByIdAndUpdate(this.book, { isAvailable: true });
    }
  }
  next()
})

const BorrowRequest = mongoose.model('BorrowRequest', borrowRequestSchema)
export default BorrowRequest