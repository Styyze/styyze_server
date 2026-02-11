import Product from '../models/Product.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';


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

// get orders by buyerId
export const getOrdersByBuyerId = async (req, res) => {
  try {
    const { buyer } = req.params;

    // 1️⃣ Validate buyerId
    if (!mongoose.Types.ObjectId.isValid(buyer)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid buyerId'
      });
    }

    // 2️⃣ Fetch buyer's orders
    const orders = await Order.find({
      buyerId: buyer
    })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    console.error('Buyer order fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch buyer orders'
    });
  }
};

// Create Order

export const createOrder = async (req, res) => {
  try {
    const { buyerId, items } = req.body;

    if (!buyerId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'buyerId and items are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(buyerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid buyerId'
      });
    }

    let orderItems = [];
    let totalAmount = 0;

    // calculate price from DB
    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }
   if (!product.isAvailable) {
   return res.status(400).json({ message: "Out of stock" });
}
      const quantity =
        Number.isInteger(item.quantity) && item.quantity > 0
          ? item.quantity
          : 1;
if (product.stock < quantity) {
   return res.status(400).json({
      message: "Insufficient stock"
   });
}
      orderItems.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        quantity,
        mediaUrl: product.media?.[0]?.mediaUrl,
        sellerId: product.seller
      });

      totalAmount += product.price * quantity;
    }

    // ✅ Create order (NOT checkout)
    const order = new Order({
      buyerId,
      items: orderItems,
      totalAmount,
      currency: 'NGN',
      paymentStatus: 'pending',
      orderStatus: 'processing'
    });

    const savedOrder = await order.save();

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: savedOrder._id
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
};
// get order for checkout

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid orderId'
      });
    }

    // 1️⃣ Fetch existing order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Prevent checkout of already paid orders
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order already paid'
      });
    }

    let recalculatedItems = [];
    let recalculatedTotal = 0;

    // 2️⃣ Re-validate items against DB
    for (const item of order.items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      recalculatedItems.push({
        productId: product._id,
        title: product.title,
        price: product.price, 
        quantity: item.quantity,
        mediaUrl: product.media?.[0]?.mediaUrl,
        sellerId: product.seller
      });

      recalculatedTotal += product.price * item.quantity;
    }

    // 3️⃣ Update order with fresh values
    order.items = recalculatedItems;
    order.totalAmount = recalculatedTotal;

    await order.save();

    // 4️⃣ Send final checkout summary
    return res.status(200).json({
      success: true,
      message: 'Checkout ready',
      data: {
        orderId: order._id,
        buyerId: order.buyerId,
        items: order.items,
        totalAmount: order.totalAmount,
        currency: order.currency,
        paymentStatus: order.paymentStatus
      }
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Checkout failed'
    });
  }
};
