import axios from 'axios';
import mongoose from 'mongoose';

import User from '../models/Users.js';
import UserProfile from '../models/UserProfile.js';
import SellerVerification from '../models/verifySellers.js';
import House from '../models/House.js';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export const approveSeller = async (req, res) => {
  let house;

  try {
    const userId="6aef22431e125426b9dc5550";
    //const adminId = req.user?.id;
    const adminId= "6add12f0c5e94f07783ac7d8";

    // 1. Authenticate the admin.
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }

    if (
      !mongoose.isValidObjectId(userId) ||
      !mongoose.isValidObjectId(adminId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user or admin ID'
      });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Paystack is not configured'
      });
    }

    const platformPercentage = Number(
      process.env.PAYSTACK_PLATFORM_PERCENTAGE_CHARGE
    );

    if (
      !Number.isFinite(platformPercentage) ||
      platformPercentage < 0 ||
      platformPercentage > 100
    ) {
      return res.status(500).json({
        success: false,
        message:
          'PAYSTACK_PLATFORM_PERCENTAGE_CHARGE must be configured between 0 and 100'
      });
    }

    
    const verification = await SellerVerification.findOne({
      userId
    }).select('+bankAccountNumber +bankCode');

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Seller verification not found'
      });
    }

    if (verification.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'A rejected verification must be resubmitted'
      });
    }

    if (
      verification.status !== 'pending' &&
      verification.status !== 'approved'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Verification cannot be approved in its current state'
      });
    }

    const [user, userProfile] = await Promise.all([
      User.findById(userId),
      UserProfile.findOne({ userId })
    ]);

    if (!user || !userProfile) {
      return res.status(200).json({
        success: false,
        message: 'User or user profile not found',
        data:[]
      });
    }

    if (verification.houseId) {
      house = await House.findOne({
        _id: verification.houseId,
        ownerId: userId
      });
    } else {
      house = await House.findOne({ ownerId: userId });
    }

    if (!house) {
      return res.status(200).json({
        success: false,
        message: 'Associated House not found'
      });
    }

    if (
      !verification.bankAccountNumber ||
      !verification.bankCode ||
      !verification.ownerName
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Verification is missing required owner or bank details'
      });
    }

    
    let subaccountCreationFailed = false;

    if (!house.subaccountCode) {
      // Mark the attempt before calling the external API.
      house.subaccountStatus = 'not_created';
      await house.save();

      try {
        const payload = {
          business_name: house.name,
          settlement_bank: verification.bankCode,
          account_number: verification.bankAccountNumber,
          percentage_charge: platformPercentage,
          description: `Styyze seller account for ${house.name}`,
          primary_contact_name: verification.ownerName,
          primary_contact_phone: verification.phone || '',
          primary_contact_email : verification.email,
        };

        const paystackResponse = await axios.post(
          `${PAYSTACK_BASE_URL}/subaccount`,
          payload,
          {
            headers: {
              Authorization:
                `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );

        const subaccountCode =
          paystackResponse.data?.data?.subaccount_code;

        if (
          !paystackResponse.data?.status ||
          !subaccountCode
        ) {
          throw new Error(
            'Paystack did not return a subaccount code'
          );
        }

        // Save the code immediately to avoid creating a duplicate
        // during a normal retry.
        house.subaccountCode = subaccountCode;
        house.subaccountCreatedAt = new Date();
        house.subaccountStatus = 'created';

        await house.save();
      } catch (paystackError) {
        subaccountCreationFailed = true;

        house.subaccountStatus = 'failed';
        await house.save();

        console.error(
          'Paystack subaccount creation failed:',
          paystackError.response?.data?.message ||
            paystackError.message
        );
      }
    } else {
      house.subaccountStatus = 'created';
    }

   
    if (verification.status !== 'approved') {
      verification.status = 'approved';
      verification.approvedBy = adminId;
      verification.approvedAt = new Date();
      verification.reviewedAt = new Date();

      await verification.save();
    }

    user.verified = true;
    user.role = 'seller';
    await user.save();

    userProfile.verified = true;
    await userProfile.save();

    
    house.isVerified = true;
    await house.save();

    if (subaccountCreationFailed) {
      return res.status(200).json({
        success: true,
        message:
          'Seller approved, but Paystack subaccount creation failed. Retry approval to try again.',
        data: {
          userId: user._id,
          houseId: house._id,
          verificationStatus: verification.status,
          houseVerificationStatus: house.verificationStatus,
          subaccountStatus: house.subaccountStatus,
          subaccountCode: null,
          retryRequired: true
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Seller approved and Paystack subaccount is ready',
      data: {
        userId: user._id,
        houseId: house._id,
        verificationStatus: verification.status,
        houseVerificationStatus: house.verificationStatus,
        subaccountStatus: house.subaccountStatus,
        subaccountCode: house.subaccountCode,
        retryRequired: false
      }
    });
  } catch (error) {
    console.error('Seller approval failed:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to complete seller approval'
    });
  }
};

// House verification rejection

export const rejectSeller = async (req, res) => {
  try {
    const { userId } = req.params;
    // const adminId = req.user?.id;
    const adminId = "6add12f0c5e94f07783ac7d8";

    const { adminComment } = req.body;

    // 1. Validate admin
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required"
      });
    }

    // 2. Validate IDs
    if (
      !mongoose.isValidObjectId(userId) ||
      !mongoose.isValidObjectId(adminId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user or admin ID"
      });
    }

    // 3. Validate rejection comment
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
      message: "House verification rejected successfully",
      data: {
        userId,
        houseId: house?._id || null,
        status: verification.status,
        adminComment: verification.adminComment,
        reviewedAt: verification.reviewedAt
      }
    });

  } catch (error) {
    console.error(" House rejection failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to reject house verification"
    });
  }
};