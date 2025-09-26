import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    // E2EE fields (required for user messages, optional for system)
    ciphertext: { type: String },
    iv: { type: String },
    salt: { type: String },
    alg: { type: String, default: 'ECDH-AES-GCM' },
    // Optional plaintext (used for system messages and legacy migration)
    message: { type: String },
    type: { type: String, enum: ['user', 'system'], default: 'user' },
    // Read status for recipient (undefined is treated as unread for legacy docs)
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;
