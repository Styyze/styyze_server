import Product from '../models/Product.js';
import mongoose from 'mongoose';

export const createProduct = async (req, res) => {
  try {
    const {
      sellerId,
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

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'sellerId is required'
      });
    }

    if (!title || !description || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'title, description, and price are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
       return res.status(400).json({ success: false,
         message: 'Invalid sellerId' });
    }

    //  Create product document
    const product = new Product({
      sellerId,
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

    //  Save product
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
