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

// Fetch product By product Id

export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    // 2️⃣ Fetch product
    const product = await Product.findById(productId)
      .populate({
        path: 'sellerId',
        select: 'name email verified role' 
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Get product by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
};

// Fetch products by sellerId



export const getProductsBySellerId = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // 1️⃣ Validate sellerId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seller ID'
      });
    }

    // 2️⃣ Confirm seller exists
    const seller = await User.findById(sellerId).select('_id verified');

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Optional: restrict to verified sellers only
    if (!seller.verified) {
      return res.status(403).json({
        success: false,
        message: 'Seller is not verified'
      });
    }

    // 3️⃣ Fetch products for this seller
    const products = await Product.find({ sellerId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'sellerId',
        select: 'name email verified'
      });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    console.error('Get products by seller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch seller products'
    });
  }
};
