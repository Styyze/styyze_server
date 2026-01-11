import Product from '../models/Product.js';
import mongoose from 'mongoose';
import User from '../models/Users.js';

export const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      currency,
      size,
      color,
      category,
      status,
      media
    } = req.body;

    

  if (!req.user || !req.user.id) {
  return res.status(401).json({
    success: false,
    message: 'Not authenticated'
  });
}

// 1️⃣ Get logged-in user ID from auth middleware
    const userId = req.user.id;
    // 2️⃣ Fetch user from DB
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 3️⃣ Verify seller status
    if (!user.verified) {
      return res.status(403).json({
        success: false,
        message: 'You must be a verified seller to create products'
      });
    }

    // 4️⃣ Validate required fields
    if (!title || !description || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'title, description, and price are required'
      });
    }

    // 5️⃣ Create product (sellerId is the logged-in user)
    const product = new Product({
      sellerId: user._id,
      title,
      description,
      price,
      currency,
      size,
      color,
      category,
      status,
      media: Array.isArray(media) ? media : []
    });

    const savedProduct = await product.save();

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: savedProduct
    });

  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
};
