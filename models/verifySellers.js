
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
    // Keep userId if other parts of the application depend on it.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    // Associate the verification with the seller's House.
    houseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'House',
      index: true
    },

    // Owner and identity details required for verification.
    ownerName: {
      type: String,
      trim: true
    },

    phone: {
      type: String,
      trim: true
    },

    documents: {
      type: [verificationDocumentSchema],
      required: true
    },

    // Bank details needed for Paystack subaccount setup.
    bankAccountNumber: {
      type: String,
      select: false
    },

    bankCode: {
      type: String,
      select: false
    },

    resolvedAccountName: {
      type: String,
      trim: true
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },

    adminComment: {
      type: String,
      default: ''
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    approvedAt: {
      type: Date
    },

    
    submittedAt: {
      type: Date,
      default: Date.now
    },

    reviewedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export default mongoose.model(
  'SellerVerification',
  sellerVerificationSchema
);
