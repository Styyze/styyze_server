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
    const { userId } = req.params;
    const adminId = req.user?.id;

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

    // percentage_charge is the percentage allocated to Styyze.
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

    // 2. Find the verification record.
    // Explicitly select bank fields because the schema uses select: false.
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

    // 3. Confirm the required records exist before calling Paystack.
    const [user, userProfile] = await Promise.all([
      User.findById(userId),
      UserProfile.findOne({ userId })
    ]);

    if (!user || !userProfile) {
      return res.status(404).json({
        success: false,
        message: 'User or user profile not found'
      });
    }

    // Prefer the House associated with this verification.
    if (verification.houseId) {
      house = await House.findOne({
        _id: verification.houseId,
        ownerId: userId
      });
    } else {
      // Compatibility fallback for older verification records.
      house = await House.findOne({ ownerId: userId });
    }

    if (!house) {
      return res.status(404).json({
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

    // 4. Create the Paystack subaccount only if one does not exist.
    // If approval previously succeeded but Paystack failed, this retries
    // subaccount creation without creating another verification record.
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
          primary_contact_phone: verification.phone || ''
        };

        if (house.email) {
          payload.primary_contact_email = house.email;
        }

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

        // Keep the KYC result separate from the subaccount result.
        house.subaccountStatus = 'failed';
        await house.save();

        // Do not log bank details, request payloads, or secret keys.
        console.error(
          'Paystack subaccount creation failed:',
          paystackError.response?.data?.message ||
            paystackError.message
        );
      }
    } else {
      // A saved subaccount code means we should not create another.
      house.subaccountStatus = 'created';
    }

   
    // subaccount creation.
    if (verification.status !== 'approved') {
      verification.status = 'approved';
      verification.approvedBy = adminId;
      verification.approvedAt = new Date();
      verification.reviewedAt = new Date();

      await verification.save();
    }

    // 6. Update the user and profile.
    user.verified = true;
    user.role = 'seller';
    await user.save();

    userProfile.verified = true;
    await userProfile.save();

    // 7. Update the House's KYC status.
    // KYC can be approved even if Paystack subaccount creation failed.
    house.verificationStatus = 'verified';
    await house.save();

    // 8. Return a clear result to the admin.
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