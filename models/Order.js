import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    title: String,
    price: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    mediaUrl: String,
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { _id: false }
);

// Shipping Address Schema
const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: String,
    city: { type: String, required: true },
    region: String,
    postalCode: String,
    country: { type: String, default: 'Ghana' }
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: v => v.length > 0
    },

    totalAmount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: 'GHS'
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true
    },

    // Payment Provider (Gateway)
    paymentProvider: {
      type: String,
      enum: ['stripe', 'paypal', 'flutterwave', 'paystack'],
      required: true
    },

    // Optional payment type
    paymentType: {
      type: String,
      enum: ['card', 'momo', 'bank_transfer', 'wallet']
    },

    paymentReference: String,
    paymentIntentId: String,

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },

    paidAt: Date,

    orderStatus: {
      type: String,
      enum: ['processing', 'shipped', 'delivered', 'cancelled'],
      default: 'processing'
    },

    trackingNumber: String,
    shippedAt: Date,
    deliveredAt: Date
  },
  { timestamps: true }
);

export default mongoose.model('Order', OrderSchema);
