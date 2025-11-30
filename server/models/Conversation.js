import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: [],
      },
    ],
  },
  { timestamps: true }
);

// Add indexes for performance optimization
conversationSchema.index({ participants: 1 }); // Find conversations by participant
conversationSchema.index({ updatedAt: -1 }); // Sort by last activity
conversationSchema.index({ participants: 1, updatedAt: -1 }); // Compound index for queries

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;