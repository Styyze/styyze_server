import SellerVerification from '../models/verifySellers.js';

export const submitSellerVerification = async (req, res) => {
  try {
    const {userId} = req.body;
    //const userId = req.user.id;
    const { documents } = req.body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Verification documents are required'
      });
    }

    const existing = await SellerVerification.findOne({ userId });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Verification already submitted'
      });
    }

    const verification = new SellerVerification({
      userId,
      documents,
      status: 'pending'
    });

    await verification.save();

    return res.status(201).json({
      success: true,
      data: 'Verification submitted and pending review'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit verification'
    });
  }
};
