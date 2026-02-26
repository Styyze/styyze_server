import Product from '../models/Product.js';
import CheckoutSession from '../models/CheckoutSession.js';
import CheckoutDetails from '../models/CheckoutDetails.js';
import PreOrder from '../models/PreOrder.js';
import mongoose from 'mongoose';
import crypto from 'crypto';


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

    const orders = await CompletedOrder.aggregate([
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

      //  Recalculate totalAmount for this seller
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

      //  Sort newest first
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

    //  Validate buyerId
    if (!mongoose.Types.ObjectId.isValid(buyer)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid buyerId'
      });
    }

    //  Fetch buyer's orders
    const orders = await CompletedOrder.find({
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

// Create Pre-Order

export const createPreOrder = async (req, res) => {
  try {

    const { buyerId, items } = req.body;

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items provided"
      });
    }

    // Validate buyerId
    if (!mongoose.Types.ObjectId.isValid(buyerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid buyerId"
      });
    }

    // Collect productIds
    const productIds = items.map(i => i.productId);

    
    const products = await Product.find({
      _id: { $in: productIds }
    });

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid products found"
      });
    }

    
    const productMap = new Map(
      products.map(p => [p._id.toString(), p])
    );

    let orderItems = [];
    let totalAmount = 0;

    for (const item of items) {

      const product = productMap.get(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      // Validate quantity
      const quantity =
        Number.isInteger(item.quantity) && item.quantity > 0
          ? item.quantity
          : null;

      if (!quantity) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${product.title}`
        });
      }

      //  Stock validation
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} left for ${product.title}`
        });
      }

      const subtotal = product.price * quantity;
      totalAmount += subtotal;

      orderItems.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        quantity,
        mediaUrl: product.media?.[0]?.mediaUrl || null,
        sellerId: product.seller
      });
    }

    // Create PreOrder snapshot
    const preorder = await PreOrder.create({
      buyerId,
      items: orderItems,
      totalAmount,
      currency: products[0]?.currency || "NGN"
    });

    return res.status(201).json({
      success: true,
      data: preorder
    });

  } catch (error) {

    console.error("Create PreOrder Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// getPreOrderById

export const getPreOrderById = async (req, res) => {
  try {

    const { preOrderId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(preOrderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid preOrderId"
      });
    }

    // Fetch preorder
    const preorder = await PreOrder.findById(preOrderId)
      .populate("buyerId", "name email") 
      .populate("items.productId", "title price media seller"); 

    if (!preorder) {
      return res.status(404).json({
        success: false,
        message: "PreOrder not found"
      });
    }

    res.status(200).json({
      success: true,
      data: preorder
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};
// Add Shipping and Payment details


export const createCheckoutDetails = async (req, res) => {

  try {

    const { preorderId } = req.params;

    const {
      shippingAddress,
      paymentInfo
    } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(preorderId)) {
      return res.status(400).json({
        message: 'Invalid preorderId'
      });
    }

    // Check preorder exists
    const preorder = await PreOrder.findById(preorderId);

    if (!preorder) {
      return res.status(404).json({
        message: 'PreOrder not found'
      });
    }
if (preorder.status === 'payment-started') {

  return res.status(400).json({
    message: 'Cannot update checkout after payment started'
  });

}
    // Prevent duplicate checkout creation
    const existingCheckout = await CheckoutDetails.findOne({
      preorderId
    });

    if (existingCheckout) {
      return res.status(400).json({
        message: 'Checkout details already created'
      });
    }

    // Create checkout details
    const checkoutDetails = await CheckoutDetails.create({
      preorderId,
      shippingAddress,
      paymentInfo
    });

    // Move preorder state forward
    preorder.status = 'checkout-info-added';
    await preorder.save();

    res.status(201).json({
      success: true,
      data: checkoutDetails
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// Update Shipping and Payment Info
export const updateCheckoutDetails = async (req, res) => {

  try {

    const { preOrderId } = req.params;

    const {
      shippingAddress,
      paymentInfo
    } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(preOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid preorderId'
      });
    }

    // Check preorder exists
    const preorder = await PreOrder.findById(preOrderId);

    if (!preorder) {
      return res.status(404).json({
        success: false,
        message: 'PreOrder not found'
      });
    }

    //Prevent editing after payment started
    if (preorder.status === 'payment-started') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update after payment has started'
      });
    }

    // Find checkout details
    const checkoutDetails = await CheckoutDetails.findOne({preorderId:
      preOrderId
    });

    if (!checkoutDetails) {
      return res.status(404).json({
        success: false,
        message: 'CheckoutDetails not found'
      });
    }

    // PATCH update (only provided fields)
    if (shippingAddress) {
      checkoutDetails.shippingAddress = {
        ...checkoutDetails.shippingAddress,
        ...shippingAddress
      };
    }

    if (paymentInfo) {
      checkoutDetails.paymentInfo = {
        ...checkoutDetails.paymentInfo,
        ...paymentInfo
      };
    }

    await checkoutDetails.save();

    res.status(200).json({
      success: true,
      data: checkoutDetails
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });
    console.log(error);
  }
};

// Initiate payment

export const initiateCheckout = async (req, res) => {

  try {

    const { preorderId } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(preorderId)) {
      return res.status(400).json({ message: 'Invalid preorderId' });
    }

    // Atomic status lock (prevents race condition)
    const preorder = await PreOrder.findOneAndUpdate(
      {
        _id: preorderId,
        status: { $ne: 'payment-started' } 
      },
      {
        status: 'payment-started'
      },
      { new: true }
    );

    if (!preorder) {
      return res.status(400).json({
        message: 'Payment already started or preorder invalid'
      });
    }

    const checkoutDetails = await CheckoutDetails.findOne({
      preorderId
    });

    if (!checkoutDetails) {
      return res.status(400).json({
        message: 'Shipping and payment info required before checkout'
      });
    }

    // Better payment reference
    const paymentReference = crypto.randomUUID();

    const session = await CheckoutSession.create({

      preorderId,
      paymentProvider: checkoutDetails.paymentInfo.paymentProvider,
      paymentReference,
      paymentStatus: 'pending',
      totalAmount: preorder.totalAmount,
      currency: preorder.currency

    });

    // Call payment gateway here

    res.json({
      success: true,
      data: session
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

//completed Order

export const completeOrder = async (req, res) => {

  try {

    const { paymentReference } = req.body;

    const session = await CheckoutSession.findOne({ paymentReference });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const preorder = await PreOrder.findById(session.preorderId);

    const checkoutDetails = await CheckoutDetails.findOne({
      preorderId: preorder._id
    });

    const finalOrder = await Order.create({

      buyerId: preorder.buyerId,
      items: preorder.items,
      shippingAddress: checkoutDetails.shippingAddress,
      paymentInfo: checkoutDetails.paymentInfo,
      totalAmount: preorder.totalAmount,
      currency: preorder.currency,
      paymentReference,
      status: 'paid'
    });

    res.json(finalOrder);

  } catch (err) {
    res.status(500).json({ message: err.message });
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
