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
      enum: ['user', 'system'],
      default: 'user',
    },
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

const Message = mongoose.model('Message', messageSchema);

export default Message;