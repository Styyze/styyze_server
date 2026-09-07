import User from '../models/Users.js';
import UserProfile from '../models/UserProfile.js';
import SellerVerification from '../models/verifySellers.js';

export const approveSeller = async (req, res) => {
  try {
    const { userId } = req.params;

    // const adminId = req.user.id;
    const adminId = "6947b82dba67ae6dd22db7df";

    // 1. Find verification record
    const verification = await SellerVerification.findOne({ userId });

    if (!verification) {
      return res.status(404).json({
        success: false,
        data: 'Seller verification not found'
      });
    }

    if (verification.status === 'approved') {
      return res.status(400).json({
        success: false,
        data: 'Seller already approved'
      });
    }

    // 2. Update verification record
    verification.status = 'approved';
    verification.reviewedBy = adminId;
    verification.reviewedAt = new Date();

    await verification.save();

    // 3. Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        data: 'User not found'
      });
    }

    // 4. Update User
    user.verified = true;
    user.role = 'seller';

    await user.save();

    // 5. Update corresponding UserProfile
    const userProfile = await UserProfile.findOne({ userId });

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        data: 'User profile not found'
      });
    }

    userProfile.verified = true;

    await userProfile.save();

    // 6. Success response
    return res.status(200).json({
      success: true,
      data: 'Seller approved successfully'
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      data: 'Failed to approve seller'
    });
  }
};