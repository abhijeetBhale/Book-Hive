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
  // Security Deposit fields
  depositStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'forfeited', 'not_required'],
    default: 'not_required'
  },
  depositPaymentId: {
    type: String
  },
  depositAmount: {
    type: Number,
    default: 0
  },
  // Transaction metadata for rating calculations
  metadata: {
    handoverDate: Date,
    returnRequestDate: Date,
    communicationQuality: {
      responseTime: Number, // Average response time in hours
      messageCount: Number
    }
  },
  communicationStarted: {
    type: Boolean,
    default: false
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  borrowedDate: {
    type: Date
  },
  returnedDate: {
    type: Date
  },
  actualReturnDate: {
    type: Date
  },
  penalties: [{
    type: {
      type: String,
      enum: ['late_return', 'damage', 'lost', 'very_late_return']
    },
    value: Number,
    appliedAt: Date,
    paid: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
})

borrowRequestSchema.pre('save', async function(next) {
  if (this.isModified('status')) {
    const Book = mongoose.model('Book')
    if (this.status === 'borrowed') {
      await Book.findByIdAndUpdate(this.book, { isAvailable: false });
      
      // Get the book's lending duration
      const book = await Book.findById(this.book);
      const lendingDays = book?.lendingDuration || 14; // Default to 14 days if not set
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + lendingDays);
      this.dueDate = dueDate;
      this.metadata = {
        ...this.metadata,
        handoverDate: new Date()
      };
    } else if (this.status === 'returned') {
      await Book.findByIdAndUpdate(this.book, { isAvailable: true });
      this.actualReturnDate = new Date();
      
      // Calculate automatic penalties for late returns
      if (this.dueDate && this.actualReturnDate > this.dueDate) {
        const daysLate = Math.ceil((this.actualReturnDate - this.dueDate) / (1000 * 60 * 60 * 24));
        
        if (daysLate > 0) {
          const penaltyType = daysLate <= 3 ? 'late_return' : 'very_late_return';
          const penaltyValue = daysLate <= 3 ? -0.5 : -1.0;
          
          this.penalties.push({
            type: penaltyType,
            value: penaltyValue,
            appliedAt: new Date()
          });
        }
      }
    } else if (this.status === 'denied') {
      await Book.findByIdAndUpdate(this.book, { isAvailable: true });
    }
  }
  next()
})

const BorrowRequest = mongoose.model('BorrowRequest', borrowRequestSchema)
export default BorrowRequest