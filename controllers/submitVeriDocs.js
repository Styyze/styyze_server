
import axios from 'axios';
import SellerVerification from '../models/verifySellers.js';
import House from '../models/House.js';

export const submitSellerVerification = async (req, res) => {
  try {
    const userId = req.user?.id;

    const {
      documents,
      bankAccountNumber,
      bankCode,
      ownerName,
      phone
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (
      !Array.isArray(documents) ||
      documents.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Verification documents are required'
      });
    }

    if (
      !bankAccountNumber ||
      !bankCode ||
      !ownerName?.trim() ||
      !phone?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Owner name, phone, bank account number, and bank code are required'
      });
    }

    const house = await House.findOne({ ownerId: userId });

    if (!house) {
      return res.status(404).json({
        success: false,
        message: 'House not found for this user'
      });
    }

    
    const existing = await SellerVerification.findOne({ userId });

    if (existing && existing.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Verification has already been submitted'
      });
    }

    const paystackResponse = await axios.get(
      'https://api.paystack.co/bank/resolve',
      {
        params: {
          account_number: bankAccountNumber.trim(),
          bank_code: bankCode.trim()
        },
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        },
        timeout: 15000
      }
    );

    if (
      !paystackResponse.data?.status ||
      !paystackResponse.data?.data?.account_name
    ) {
      return res.status(400).json({
        success: false,
        message: 'Unable to verify this bank account. Check the account number and bank.'
      });
    }

    const resolvedAccountName =
      paystackResponse.data.data.account_name;

    const verificationData = {
      userId,
      houseId: house._id,
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      documents,
      bankAccountNumber: bankAccountNumber.trim(),
      bankCode: bankCode.trim(),
      resolvedAccountName,
      status: 'pending',
      submittedAt: new Date(),
      reviewedAt: null,
      approvedBy: null,
      approvedAt: null,
      adminComment: ''
    };

    let verification;

    if (existing?.status === 'rejected') {
      existing.set(verificationData);
      verification = await existing.save();
    } else {
      verification = await SellerVerification.create(
        verificationData
      );
    }

    house.verificationStatus = 'pending';
    await house.save();

    return res.status(201).json({
      success: true,
      message: 'Bank account verified. Documents submitted and pending admin review.',
      data: {
        status: verification.status,
        resolvedAccountName: verification.resolvedAccountName
      }
    });
  } catch (error) {
    // Do not log request bodies or bank account details.
    console.error(
      'Seller verification submission failed:',
      error.response?.data?.message || error.message
    );

    if (error.response) {
      return res.status(400).json({
        success: false,
        message: 'Paystack could not verify the bank account. Check the details and try again.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to submit verification'
    });
  }
};
