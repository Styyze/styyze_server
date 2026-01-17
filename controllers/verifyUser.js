import User from '../models/Users.js';
import SellerVerification from '../models/verifySellers.js';

export const approveSeller = async (req, res) => {
  try {
    const { userId } = req.params;
    //const adminId = req.user.id;
    const adminId="6947b82dba67ae6dd22db7df";

    //  Find verification record
    const verification = await SellerVerification.findOne({ userId });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Seller verification not found'
      });
    }

    if (verification.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Seller already approved'
      });
    }

    // 2️⃣ Update verification record
    verification.status = 'approved';
    verification.reviewedBy = adminId;
    verification.reviewedAt = new Date();
    await verification.save();

    // 3️⃣ Update user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.verified = true;
    user.role = 'seller';
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Seller approved successfully'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve seller'
    });
  }
};
