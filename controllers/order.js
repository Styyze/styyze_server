import Product from '../models/Product.js';
import CheckoutSession from '../models/CheckoutSession.js';
import CheckoutDetails from '../models/CheckoutDetails.js';
import PreOrder from '../models/PreOrder.js';
import Cart from '../models/Cart.js';
import CompletedOrder from '../models/CompletedOrder.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import axios from "axios";
import asyncHandler from 'express-async-handler';
import Project from '../models/Project.js';
import House from '../models/House.js';
import Quote from '../models/Quote.js';

// Create check-out details
export const createCheckoutDetails = async (req, res) => {
  try {

    const { preOrderId } = req.params;
    const buyerId = req.user.id;

    const {
      shippingAddress,
      paymentInfo
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(preOrderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid preorderId"
      });
    }

    const preorder = await PreOrder.findById(preOrderId);

    if (!preorder) {
      return res.status(404).json({
        success: false,
        message: "PreOrder not found"
      });
    }

    // Prevent duplicate checkout details
    const existing = await CheckoutDetails.findOne({
      preorderId: preOrderId
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "CheckoutDetails already exists"
      });
    }

    const checkoutDetails = await CheckoutDetails.create({
      preorderId: preOrderId,
      buyerId:buyerId,
      shippingAddress,
      paymentInfo,
      status: "ready-for-payment"
    });

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
//update checkout details
export const updateCheckoutDetails = async (req, res) => {

  try {

const { preOrderId } = req.params;
console.log("preorder from client", preOrderId);
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

// get orders by sellerId
export const getOrdersBySellerId = async (req, res) => {
  try {
    //const { seller } = req.params;
    const seller = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(seller)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sellerId'
      });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(seller);

    const orders = await CompletedOrder.aggregate([
      // Only orders containing this seller
      {
        $match: {
          'items.sellerId': sellerObjectId
        }
      },

      // Keep only this seller's items
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
    //const { buyer } = req.params;
    const buyer=req.user.id;

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
// get preorder and user shipping details



export const getCheckoutData = asyncHandler(async (req, res) => {

  const { preorderId } = req.params;
  // fetch preorder using preorderId
  // fetch checkoutDetails using buyerId
  const [preorder, checkoutDetails] = await Promise.all([

    PreOrder.findById(preorderId),

    CheckoutDetails.findOne({
      buyerId: req.user.id
    })

  ]);

  // preorder not found
  if (!preorder) {
  res.status(404);
  throw new Error('Preorder not found');
}

  res.status(200).json({

    success: true,

    preorder,

    checkoutDetails

  });

});

// getPreOrderById
export const getPreOrderById = async (req, res) => {
  try {

    const { preorderId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(preorderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid preorderId"
      });
    }

    // Fetch preorder
    const preorder = await PreOrder.findById(preorderId)
      .populate("buyerId", "name email");

    if (!preorder) {
      return res.status(404).json({
        success: false,
        message: "PreOrder not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: preorder
    });

  } catch (error) {

    console.error("Get PreOrder Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};
// buy now create pre-order
export const createBuyNowPreOrder = async (req, res) => {
  try {
    const { items } = req.body;

        const buyerId = req.user.id;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required"
      });
    }

    let orderItems = [];
    let totalAmount = 0;

    for (const item of items) {

      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid productId"
        });
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1"
        });
      }

      // find product
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} left in stock`
        });
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        quantity: item.quantity,
        mediaUrl: product.media?.[0]?.mediaUrl || null,
        sellerId: product.seller
      });
    }

    const preorder = await PreOrder.create({
      buyerId,
      items: orderItems,
      totalAmount,
      currency: "NGN",
      status: "pending"
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
// Create Pre-Order
export const createPreOrder = async (req, res) => {
  try {
    const { cartId } = req.body;
    const buyerId = req.user.id;
;
    // Validate cartId
    if (!mongoose.Types.ObjectId.isValid(cartId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cartId"
      });
    }

    // Fetch cart
    const cart = await Cart.findById(cartId);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    //ensure cart belongs to logged-in user
    if (!cart.buyerId.equals(buyerId)) {
  return res.status(403).json({
    success: false,
    message: "Unauthorized access to cart"
  });
}

    // Validate cart items
    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty"
      });
    }

    // Collect product IDs
    const productIds = cart.items.map(item => item.product);

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

    for (const item of cart.items) {
      const product = productMap.get(item.product.toString());

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} left for ${product.title}`
        });
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        quantity: item.quantity,
        mediaUrl: product.media?.[0]?.mediaUrl || null,
        sellerId: product.seller
      });
    }

    // Create PreOrder snapshot
    const preorder = await PreOrder.create({
      buyerId,
      items: orderItems,
      totalAmount,
      currency: products[0]?.currency || "NGN",
      status: "pending"
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
// Initiate payment
export const initiateCheckout = async (req, res) => {
  try {
    const { preorderId, email } = req.body;
    const buyerId = req.user.id;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(preorderId) ||
      !mongoose.Types.ObjectId.isValid(buyerId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid preorderId or buyerId"
      });
    }

    // Find preorder
    const preorder = await PreOrder.findOne({
      _id: preorderId,
      buyerId: buyerId
    });

    if (!preorder) {
      return res.status(404).json({
        success: false,
        message: "Preorder not found"
      });
    }

    // check if already paid
    if (preorder.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order already paid"
      });
    }

    // Ensure checkout details exist
    const checkoutDetails = await CheckoutDetails.findOne({ preorderId });


    if (!checkoutDetails) {
      return res.status(400).json({
        success: false,
        message: "Shipping and payment info required before checkout"
      });


    }

    // Update status only if not already started
    if (preorder.status !== "payment-started") {
      preorder.status = "payment-started";
      await preorder.save();







      
    }

    const paymentReference = crypto.randomUUID();

    const session = await CheckoutSession.create({
      preorderId,
      paymentReference,
      paymentStatus: "pending",
      totalAmount: preorder.totalAmount,
      currency: preorder.currency,
      email: email,
      amountInKobo: preorder.totalAmount * 100,
      paymentProvider: "paystack"
    });

    // Initialize Paystack transaction
    const paystackResponse = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: email,
        amount: preorder.totalAmount * 100,
        reference: paymentReference,
        callback_url: "https://styyze.vercel.app/marketplace/payment-success"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const { authorization_url, access_code } = paystackResponse.data.data;

    return res.json({
      success: true,
      data: {
        session,
        authorization_url,
        access_code,
        reference: paymentReference
      }
    });

  } catch (error) {
    console.error(error?.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// intiate payment for project


// Central fee calculation helper (Brief section 2.2)
const calculatePlatformFee = (house, amount) => {
  const percentage = process.env.PAYSTACK_PLATFORM_PERCENTAGE_CHARGE || 0.07;
  return Math.round(amount * percentage * 100) / 100;
};

export const initiateProjectPayment = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email } = req.body;
    const buyerId = req.user.id;
console.log("received!");
    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(buyerId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid projectId or buyerId"
      });
    }

    // Find project and verify customer ownership
    const project = await Project.findOne({
      _id: projectId,
      customerId: buyerId
    });

    if (!project) {
      return res.status(200).json({
        success: false,
        message: "Project not found or unauthorized",
        data:[]
      });
    }

    // Check if already paid
    if (project.paymentStatus === "paid" || project.status === "paid") {
      return res.status(409).json({
        success: false,
        message: "Project has already been paid for"
      });
    }

    let amount = 0;
    let currency = 'NGN';

    if (project.pricing && project.pricing.amount) {
      amount = project.pricing.amount;
      currency = project.pricing.currency || 'GHS';
    } else {
      const quote = await Quote.findOne({ projectId: project._id, status: 'accepted' });
      if (!quote) {
        return res.status(400).json({
          success: false,
          message: "Project does not have an accepted price or quote yet"
        });
      }
      amount = quote.amount;
      currency = quote.currency || 'NGN';
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid project amount"
      });
    }

    const house = await House.findById(project.houseId);
    if (!house) {
      return res.status(404).json({
        success: false,
        message: "Associated House not found"
      });
    }

    if (!house.isVerified || house.subaccountStatus !== 'created' || !house.subaccountCode) {
      return res.status(422).json({
        success: false,
        message: "House is not fully verified or payment subaccount is missing"
      });
    }

    const paymentReference = crypto.randomUUID();
    const platformFee = calculatePlatformFee(house, amount);
    const amountInSubunits = Math.round(amount * 100);

    // Create checkout session for verification mapping
    const session = await CheckoutSession.create({
      projectId,
      paymentReference,
      paymentStatus: "pending",
      totalAmount: amount,
      currency: currency,
      email: email || req.user.email,
      amountInKobo: amountInSubunits,
      paymentProvider: "paystack"
    });

    // Save payment reference on project for tracking & resumability
    project.paymentReference = paymentReference;
    await project.save();

    // Initialize Paystack transaction with House subaccount split & fee
    const paystackResponse = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: email || req.user.email,
        amount: amountInSubunits,
        currency: currency,
        reference: paymentReference,
        subaccount: house.subaccountCode,
        transaction_charge: Math.round(platformFee * 100),
        bearer: "subaccount",
        metadata: {
          type: "project",
          projectId: project._id.toString(),
          houseId: house._id.toString(),
          customerId: buyerId.toString()
        },
        callback_url: `${process.env.FRONTEND_URL || "https://styyze.vercel.app"}/marketplace/payment-success?type=project&projectId=${project._id}`
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const { authorization_url, access_code } = paystackResponse.data.data;

    return res.json({
      success: true,
      data: {
        session,
        authorization_url,
        access_code,
        reference: paymentReference
      }
    });

  } catch (error) {
    console.error("Project payment initialization error:", error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: error?.response?.data?.message || error.message
    });
  }
};
//completed Order

export const completeOrder = async (req, res) => {
  try {

    const { paymentReference } = req.body;

    // Find checkout session
    const session = await CheckoutSession.findOne({ paymentReference });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Get preorder
    const preorder = await PreOrder.findById(session.preorderId);

    if (!preorder) {
      return res.status(404).json({ message: "PreOrder not found" });
    }

    // Get checkout details
    const checkoutDetails = await CheckoutDetails.findOne({
      preorderId: preorder._id
    });

    if (!checkoutDetails) {
      return res.status(404).json({ message: "Checkout details not found" });
    }

    // GROUP ITEMS BY SELLER
    const sellerItemsMap = {};

    preorder.items.forEach((item) => {
      const sellerId = item.sellerId.toString();

      if (!sellerItemsMap[sellerId]) {
        sellerItemsMap[sellerId] = [];
      }

      sellerItemsMap[sellerId].push(item);
    });

    const createdOrders = [];

    // CREATE ONE ORDER PER SELLER
    for (const sellerId in sellerItemsMap) {

      const items = sellerItemsMap[sellerId];

      // Calculate total for this seller
      const sellerTotal = items.reduce((sum, item) => {
        return sum + item.price * item.quantity;
      }, 0);

      const order = await Order.create({
        buyerId: preorder.buyerId,
        sellerId: sellerId,

        items: items,

        shippingAddress: checkoutDetails.shippingAddress,

        paymentProvider: checkoutDetails.paymentInfo.provider,
        paymentType: checkoutDetails.paymentInfo.type,

        paymentReference: paymentReference,

        totalAmount: sellerTotal,
        currency: preorder.currency,

        paymentStatus: "paid",
        paidAt: new Date(),

        orderStatus: "processing"
      });

      createdOrders.push(order);
    }

    return res.status(201).json({
      success: true,
      message: "Orders created successfully",
      orders: createdOrders
    });
    await createNotification({
    recipientId: house.houseId,

    type: "order_placed",

    title: `New order for ${product.name}`,

    body: `You received a new order for ${product.name}`,

    meta: {
        orderId: order._id,
        productId: product._id,
        productName: product.name,
        amount: order.amount,
        currency: order.currency
    },

    actionUrl: "/products"
});

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: err.message
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
      return res.status(200).json({
        success: true,
        message: "Order not found",
        data:[]
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
          price: product.price, 
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

// getOrderById
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid orderId'
      });
    }

    // Fetch existing order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(200).json({
        success: false,
        message: 'Order not found',
        data:[]
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

    for (const item of order.items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(200).json({
          success: true,
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

    //  Update order with fresh values
    order.items = recalculatedItems;
    order.totalAmount = recalculatedTotal;

    await order.save();

    // Send final checkout summary
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

