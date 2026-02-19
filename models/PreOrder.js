import mongoose from 'mongoose';

const PreorderItemSchema = new mongoose.Schema(
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

const PreOrderSchema = new mongoose.Schema(
{
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  items: {
    type: [PreorderItemSchema],
    required: true,
    validate: v => v.length > 0
  },

  totalAmount: Number,

  currency: {
    type: String,
    default: 'NGN'
  },

  status: {
    type: String,
    enum: ['draft','checkout-info-added','payment-started'],
    default: 'draft'
  }
},
{ timestamps: true }
);

export default mongoose.model('PreOrder', PreOrderSchema);
