import mongoose from 'mongoose';

const CheckoutSessionSchema = new mongoose.Schema({
  preorderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PreOrder',
    required: true
  },

  paymentProvider: {
    type: String,
    default: "paystack"
  },

  paymentReference: {
    type: String,
    required: true,
    unique: true
  },

  paymentStatus: {
    type: String,
    enum: ['pending','success','failed'],
    default: 'pending'
  },

  email: {
    type: String,
    required: true
  },

  amountInKobo: {
    type: Number,
    required: true
  },

  gatewayResponse: Object

}, { timestamps: true });

export default mongoose.model('CheckoutSession', CheckoutSessionSchema);
