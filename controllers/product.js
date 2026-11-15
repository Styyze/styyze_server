import Product from '../models/Product.js';
import mongoose from 'mongoose';
import User from '../models/Users.js';
import asyncHandler from "express-async-handler";
import Collection from '../models/HouseCollection.js';
import House from "../models/House.js";

export const createProduct = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      title,
      description,
      price,
      currency,
      size,
      color,
      category,
      media
    } = req.body;

    // Authenticate user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const userId = req.user.id;

    // Fetch user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify seller status
    if (!user.verified) {
      return res.status(403).json({
        success: false,
        message: 'You must be a verified seller to create products'
      });
    }

    // Validate required fields
    if (!title || !description || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'title, description, and price are required'
      });
    }

    const stock = req.body.stock !== undefined
      ? Number(req.body.stock)
      : 0;

    if (!Number.isFinite(stock) || stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock must be a valid non-negative number'
      });
    }

    // Find the seller's house
    const house = await House.findOne({
      ownerId: user._id
    });

    if (!house) {
      return res.status(404).json({
        success: false,
        message: 'House not found for this seller'
      });
    }

    let savedProduct;

    // Start transaction
    await session.withTransaction(async () => {

      // Create product
      const product = new Product({
        seller: user._id,
        title,
        description,
        price,
        currency,
        size,
        color,
        category,
        stock,
        media: Array.isArray(media) ? media : []
      });

      const products = await Product.create(
        [product],
        { session }
      );

      savedProduct = products[0];

      // Determine product availability
      const productStatus = stock > 0
        ? 'active'
        : 'out_of_stock';

      // Product snapshot for collection
      const productSnapshot = {
        product: savedProduct._id,
        title: savedProduct.title,
        description: savedProduct.description,
        price: savedProduct.price,
        media: savedProduct.media,
        currency: savedProduct.currency,
        size: savedProduct.size,
        color: savedProduct.color,
        category: savedProduct.category,
        stock: savedProduct.stock,
        status: productStatus,
        addedAt: new Date(),
        deletedAt: null
      };

      // Add product to house collection.
      await Collection.findOneAndUpdate(
        { houseId: house._id },
        {
          $setOnInsert: {
            house: house._id
          },
          $push: {
            products: productSnapshot
          }
        },
        {
          upsert: true,
          new: true,
          session,
          setDefaultsOnInsert: true
        }
      );

    });

    return res.status(201).json({
      success: true,
      message: 'Product created and added to house collection successfully',
      data: savedProduct
    });

  } catch (error) {
    console.error('Create product error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });

  } finally {
    await session.endSession();
  }
};
// get collection by houseId
export const getCollection = async (req, res) => {
  try {
    const { houseId } = req.params;

    // Validate houseId
    if (!mongoose.Types.ObjectId.isValid(houseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid house ID'
      });
    }

    // Check if house exists
    const house = await House.findById(houseId);

    if (!house) {
      return res.status(404).json({
        success: false,
        message: 'House not found'
      });
    }

    // Fetch house collection
    const collection = await Collection.findOne({
      house: houseId
    }).lean();

    if (!collection) {
      return res.status(200).json({
        success: true,
        message: 'No collection found for this house',
        data: {
          house: houseId,
          products: []
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Collection retrieved successfully',
      data: collection
    });

  } catch (error) {
    console.error('Get collection error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve collection'
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

    // Fetch product
    const product = await Product.findById(productId)
      .populate({
        path: 'seller',
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
    const { seller } = req.params;
    // 1Validate sellerId
    if (!mongoose.Types.ObjectId.isValid(seller)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seller ID'
      });
    }

    // Confirm seller exists
    const verifiedSeller = await User.findById(seller).select('_id verified');

    if (!verifiedSeller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    //  restrict to verified sellers only
    if (!verifiedSeller.verified) {
      return res.status(403).json({
        success: false,
        message: 'Seller is not verified'
      });
    }

    const products = await Product.find({ seller })
      .sort({ createdAt: -1 })
      .populate({
        path: 'seller',
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

// update product

export const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  // Ensure the authenticated user owns the product
  if (product.seller.toString() !== req.user.id.toString()) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this product",
    });
  }

  const allowedFields = [
    "title",
    "description",
    "price",
    "media",
    "currency",
    "size",
    "color",
    "category",
    "stock",
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  }

  // Validation
  if (product.price < 0) {
    return res.status(400).json({
      success: false,
      message: "Price cannot be negative",
    });
  }

  if (product.stock < 0) {
    return res.status(400).json({
      success: false,
      message: "Stock cannot be negative",
    });
  }

  const updatedProduct = await product.save();

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product: updatedProduct,
  });
});


// delete product
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check ownership
    if (product.seller.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this product",
      });
    }

    await Product.findByIdAndDelete(productId);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};