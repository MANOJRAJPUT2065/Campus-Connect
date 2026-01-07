import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true,
      index: true
    },
    receiverId: {
      type: String,
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index for faster queries
messageSchema.index({ senderId: 1, receiverId: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
