import mongoose from 'mongoose';

const sellerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  verifiedAt: {
    type: Date
  },

  rejectedReason: {
    type: String
  }

}, { timestamps: true });

export default mongoose.model("Seller", sellerSchema);
