import Product from '../models/Product.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';

export const createOrder = async (req, res) => {
  try {
    const { buyerId, items } = req.body;

    if (!buyerId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'buyerId and items are required'
      });
    }

    let orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      const quantity = item.quantity || 1;

      orderItems.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        quantity,
        mediaUrl: product.media?.[0]?.mediaUrl,
        sellerId: product.sellerId
      });

      totalAmount += product.price * quantity;
    }

    const order = new Order({
      buyerId,
      items: orderItems,
      totalAmount,
      currency: 'NGN'
    });

    const savedOrder = await order.save();

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: savedOrder
    });

  } catch (error) {
    console.error('Create order error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
};

// get orders by sellerId
export const getOrdersBySellerId = async (req, res) => {
  try {
    const { seller } = req.params;

    if (!mongoose.Types.ObjectId.isValid(seller)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sellerId'
      });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(seller);

    const orders = await Order.aggregate([
      // 1️⃣ Only orders containing this seller
      {
        $match: {
          'items.sellerId': sellerObjectId
        }
      },

      // 2️⃣ Keep only this seller's items
      {
        $addFields: {
          items: {
            $filter: {
              input: '$items',
              as: 'item',
              cond: { $eq: ['$$item.sellerId', sellerObjectId] }
            }
          }
        }
      },

      // 3️⃣ Recalculate totalAmount for this seller
      {
        $addFields: {
          totalAmount: {
            $sum: {
              $map: {
                input: '$items',
                as: 'item',
                in: { $multiply: ['$$item.price', '$$item.quantity'] }
              }
            }
          }
        }
      },

      // 4️⃣ Sort newest first
      { $sort: { createdAt: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    console.error('Seller order fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch seller orders'
    });
  }
};