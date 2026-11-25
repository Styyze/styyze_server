
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

// House verification rejection


export const rejectSeller = async (req, res) => {
  try {
    const { userId } = req.params;
    // const adminId = req.user?.id;
    const adminId = "6add12f0c5e94f07783ac7d8";

    const { adminComment } = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required"
      });
    }

    if (
      !mongoose.isValidObjectId(userId) ||
      !mongoose.isValidObjectId(adminId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user or admin ID"
      });
    }

    if (
      !adminComment ||
      typeof adminComment !== "string" ||
      !adminComment.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rejection reason"
      });
    }

    // 4. Find verification
    const verification = await SellerVerification.findOne({
      userId
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Seller verification not found"
      });
    }

    // 5. Check current status
    if (verification.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "An approved seller cannot be rejected"
      });
    }

    if (verification.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "This verification has already been rejected"
      });
    }

    if (verification.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Verification cannot be rejected in its current state"
      });
    }

    // 6. Update verification
    verification.status = "rejected";
    verification.adminComment = adminComment.trim();
    verification.reviewedAt = new Date();

    await verification.save();

    // 7. Find user and profile
    const [user, userProfile] = await Promise.all([
      User.findById(userId),
      UserProfile.findOne({ userId })
    ]);

    if (user) {
      user.verified = false;
      await user.save();
    }

    if (userProfile) {
      userProfile.verified = false;
      await userProfile.save();
    }

    // 8. Update associated House
    const house = verification.houseId
      ? await House.findOne({
          _id: verification.houseId,
          ownerId: userId
        })
      : await House.findOne({ ownerId: userId });

    if (house) {
      house.isVerified = false;
      await house.save();
    }

    return res.status(200).json({
      success: true,
      message: "Seller verification rejected successfully",
      data: {
        userId,
        houseId: house?._id || null,
        status: verification.status,
        adminComment: verification.adminComment,
        reviewedAt: verification.reviewedAt
      }
    });

  } catch (error) {
    console.error("Seller rejection failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to reject seller verification"
    });
  }
};