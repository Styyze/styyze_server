import Product from '../models/Product.js';
import UserProfile from '../models/UserProfile.js';

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([

  // Join with UserProfile using seller → userId
  {
    $lookup: {
      from: 'userprofiles',
      localField: 'seller',
      foreignField: 'userId',
      as: 'sellerProfile'
    }
  },

  // Convert sellerProfile array → object
  {
    $unwind: {
      path: '$sellerProfile',
      preserveNullAndEmptyArrays: true
    }
  },

  // Shape response
  {
    $project: {
      title: 1,
      description: 1,
      price: 1,
      currency: 1,
      size: 1,
      color: 1,
      category: 1,
      stock: 1,
      media: 1,
      createdAt: 1,

      seller: {
        userId: '$sellerProfile.userId',
        name: '$sellerProfile.name',
        username: '$sellerProfile.username',
        avatarUrl: '$sellerProfile.avatarUrl',
        bio: '$sellerProfile.bio',
        location: '$sellerProfile.location',
      }
    }
  },

  // Latest products first
  {
    $sort: { createdAt: -1 }
  }

]);


    return res.status(200).json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
};
