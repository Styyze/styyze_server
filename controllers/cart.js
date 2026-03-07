import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

export const createCartItems = async (req, res) => {
  try {
    const { buyerId, productId, quantity } = req.body;

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
    const productDoc = await Product.findById(productId);

    if (!productDoc) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Check stock
    if (productDoc.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Only ${productDoc.stock} left in stock`
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ buyerId });

    if (!cart) {
      cart = await Cart.create({
        buyerId,
        items: [{ product: productId, quantity: qty }]
      });

      return res.status(201).json({
        success: true,
        data: cart
      });
    }

    // Check if product already in cart
    const existingItem = cart.items.find(
      item => item.product.toString() === productId
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + qty;

      if (productDoc.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${productDoc.stock} left in stock`
        });
      }

      existingItem.quantity = newQuantity;

    } else {
      cart.items.push({
        product: productId,
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

export const getCartByUserId = async (req, res) => {
  try {
    const { buyerId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(buyerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId"
      });
    }

    // Find cart and populate product details
    const cart = await Cart.findOne({ buyerId })
      .populate({
        path: "items.product",
        select: "title price stock media"
      });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: cart
    });

  } catch (error) {
    console.error("Get Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// remove item

export const removeCartItem = async (req, res) => {
  try {
    const { cartId, productId } = req.params;
    const userId = req.user.id;

    if (
      !mongoose.Types.ObjectId.isValid(cartId) ||
      !mongoose.Types.ObjectId.isValid(productId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID(s)"
      });
    }

    const cart = await Cart.findOne({
      _id: cartId,
      buyerId: userId
    });

    if (!cart) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to modify this cart"
      });
    }

    const updatedCart = await Cart.findByIdAndUpdate(
      cartId,
      {
        $pull: { items: { productId: productId } }
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Item removed successfully",
      data: updatedCart
    });

  } catch (error) {
    console.error("Remove Cart Item Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//Update cart
export const updateCartItem = async (req, res) => {
  try {
    const { cartId, productId } = req.params;
    const { quantity } = req.body;

    const userId = req.user.id; 

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(cartId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid cartId or productId"
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1"
      });
    }

    const cart = await Cart.findOne({
      _id: cartId,
      buyerId: userId
    });

    if (!cart) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this cart"
      });
    }
const productObjectId = new mongoose.Types.ObjectId(productId);

    const item = cart.items.find(
  item => item.productId.equals(productId)
                  );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart"
      });
    }

    // Stock validation (read-only)
    const product = await Product.findById(productId);

    if (!product || product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product?.stock || 0} left in stock`
      });
    }

    item.quantity = quantity;

    await cart.save();

    return res.status(200).json({
      success: true,
      data: cart
    });

  } catch (error) {
    console.error("Update Cart Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// delete cart

// Delete entire cart
export const deleteCart = async (req, res) => {
  try {
    const { cartId } = req.params;
    const userId = req.user.id; 
console.log("userId delete cart",userId);
    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(cartId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid cartId or userId"
      });
    }

    // Ensure cart belongs to logged-in user
    const cart = await Cart.findOne({
      _id: cartId,
      buyerId: userId
    });

    if (!cart) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this cart"
      });
    }

    await Cart.findByIdAndDelete(cartId);

    return res.status(200).json({
      success: true,
      message: "Cart deleted successfully"
    });

  } catch (error) {
    console.error("Delete Cart Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};