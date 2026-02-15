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
    const {
      buyerId,
      items,
      shippingAddress,
      paymentProvider,
      paymentType
    } = req.body;

    // Basic validation
    if (!buyerId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'buyerId and items are required'
      });
    }

    if (!shippingAddress || !paymentProvider) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address and payment provider required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(buyerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid buyerId'
      });
    }

    // ✅ Fetch ALL products once (optimized)
    const productIds = items.map(i => i.productId);

    const products = await Product.find({
      _id: { $in: productIds }
    });

    // Create quick lookup map
    const productMap = new Map(
      products.map(p => [p._id.toString(), p])
    );

    let orderItems = [];
    let totalAmount = 0;

    // Build order items
    for (const item of items) {

      const product = productMap.get(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      // Using stock instead of virtual for clarity
      if (product.stock <= 0) {
        return res.status(400).json({
          success: false,
          message: "Out of stock"
        });
      }

      const quantity =
        Number.isInteger(item.quantity) && item.quantity > 0
          ? item.quantity
          : 1;

      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
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

    // Create order
    const order = new Order({
      buyerId,
      items: orderItems,
      totalAmount,
      currency: 'NGN',
      shippingAddress,
      paymentProvider,
      paymentType,
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


// Update order details
// PATCH update order before checkout

export const updateOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const {
      shippingAddress,
      paymentProvider,
      paymentType,
      items
    } = req.body;

    // Validate orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid orderId"
      });
    }

    // Fetch order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    //  Prevent updates after payment started
    if (order.paymentStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Order can no longer be modified"
      });
    }

    // Update allowed simple fields
    if (shippingAddress) {
      order.shippingAddress = shippingAddress;
    }

    if (paymentProvider) {
      order.paymentProvider = paymentProvider;
    }

    if (paymentType) {
      order.paymentType = paymentType;
    }

    //  Update items (quantity only)
    if (Array.isArray(items) && items.length > 0) {

      const productIds = items.map(i => i.productId);

      const products = await Product.find({
        _id: { $in: productIds }
      });

      const productMap = new Map(
        products.map(p => [p._id.toString(), p])
      );

      let updatedItems = [];
      let recalculatedTotal = 0;

      for (const item of items) {

        const product = productMap.get(item.productId);

        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product not found: ${item.productId}`
          });
        }

        const quantity =
          Number.isInteger(item.quantity) && item.quantity > 0
            ? item.quantity
            : 1;

        if (product.stock < quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.title}`
          });
        }

        updatedItems.push({
          productId: product._id,
          title: product.title,
          price: product.price, // always from DB
          quantity,
          mediaUrl: product.media?.[0]?.mediaUrl,
          sellerId: product.seller
        });

        recalculatedTotal += product.price * quantity;
      }

      // overwrite items safely
      order.items = updatedItems;
      order.totalAmount = recalculatedTotal;
    }

    // Save updated order
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: order
    });

  } catch (error) {
    console.error("Update order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order"
    });
  }
};
