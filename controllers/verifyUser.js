import User from '../models/Users.js';
import Seller from '../models/Sellers.js';

export const verifyUser = async (req, res) => {
  try {
    const { userId } = req.params; 

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 2️⃣ Set user as verified
    user.verified = true;
    await user.save();

    // 3️⃣ Create or update Seller entry
    // Check if a Seller document already exists
    let seller = await Seller.findOne({ userId: user._id });

    if (!seller) {
      // Create new Seller document
      seller = new Seller({
        userId: user._id,
        status: 'approved',
        verifiedAt: new Date()
      });
      await seller.save();
    } else {
      // Update existing Seller document
      seller.status = 'approved';
      seller.verifiedAt = new Date();
      await seller.save();
    }

    return res.status(200).json({
      success: true,
      message: `User ${user.username} has been verified and added as seller`,
      data: {
        user: { id: user._id, verified: user.verified },
        seller: {
          id: seller._id,
          status: seller.status,
          verifiedAt: seller.verifiedAt
        }
      }
    });

  } catch (error) {
    console.error('User verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify user'
    });
  }
};
