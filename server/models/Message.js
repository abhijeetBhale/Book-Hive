import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, trim: true },
    message: { type: String, trim: true },
    ciphertext: { type: String },
    iv: { type: String },
    salt: { type: String },
    alg: { type: String },
    read: { type: Boolean, default: false },
    messageType: {
      type: String,
      enum: ['user', 'system', 'file'],
      default: 'user',
    },
    // File message fields
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    fileType: { type: String },
    // Message status tracking
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    // Soft-delete per user
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  },
  { timestamps: true }
);

// Add indexes for performance optimization
messageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 }); // Conversation queries
messageSchema.index({ recipientId: 1, read: 1 }); // Unread messages
messageSchema.index({ createdAt: -1 }); // Sorting by date
messageSchema.index({ status: 1 }); // Status queries

const Message = mongoose.model('Message', messageSchema);

export default Message;