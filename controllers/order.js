import Product from '../models/Product.js';
import Order from '../models/Order.js';

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
