import mongoose from 'mongoose';

const verificationDocumentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'id_card',
        'passport',
        'utility_bill',
        'business_registration',
        'tax_certificate'
      ]
    },

    fileUrl: {
      type: String,
      required: true
    },

    publicId: {
      type: String 
    }
  },
  { _id: false }
);

const sellerVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    documents: {
      type: [verificationDocumentSchema],
      required: true
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },

    adminComment: {
      type: String
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' 
    },

    approvedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export default mongoose.model('SellerVerification', sellerVerificationSchema);
