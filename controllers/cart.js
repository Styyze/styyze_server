import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

export const createCartItems = async (req, res) => {
  try {

    const { buyerId, productId, quantity } = req.body;
console.log(buyerId);
    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(buyerId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId or productId"
      });
    }

    // Validate quantity
    const qty =
      Number.isInteger(quantity) && quantity > 0
        ? quantity
        : null;

    if (!qty) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity"
      });
    }

    // Check product exists
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Check stock
    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} left in stock`
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ buyerId });

    if (!cart) {
      cart = await Cart.create({
        buyerId,
        items: [{ productId, quantity: qty }]
      });

      return res.status(201).json({
        success: true,
        data: cart
      });
    }

    // Check if product already in cart
    const existingItem = cart.items.find(
      item => item.productId.toString() === productId
    );

    if (existingItem) {

      const newQuantity = existingItem.quantity + qty;

      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} left in stock`
        });
      }

      existingItem.quantity = newQuantity;

    } else {
      cart.items.push({
        productId,
        quantity: qty
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      data: cart
    });

  } catch (error) {

    console.error("Create Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};