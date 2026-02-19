import mongoose from 'mongoose';


const FinalOrderSchema = new mongoose.Schema({

  buyerId: mongoose.Schema.Types.ObjectId,

  items: [PreorderItemSchema],

  shippingAddress: Object,

  paymentInfo: Object,

  totalAmount: Number,

  currency: String,

  paymentReference: String,

  status: {
    type: String,
    enum: ['paid','processing','shipped','delivered'],
    default: 'paid'
  }

},
{ timestamps: true });

export default mongoose.model('Order', FinalOrderSchema);
