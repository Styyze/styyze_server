import mongoose from 'mongoose';

const CheckoutDetailsSchema = new mongoose.Schema(
{
  preorderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PreOrder',
    required: true
  },

  shippingAddress: {
    fullName: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    addressLine1: {
      type: String,
      required: true
    },
    addressLine2: String,
    city: {
      type: String,
      required: true
    },
    state: String,
    country: {
      type: String,
      required: true
    },
    postalCode: String
  },

  paymentInfo: {

    paymentProvider: {
      type: String,
      enum: ['paystack','flutterwave','stripe','internal'],
      required: true
    },

    paymentMethod: {
      type: String,
      enum: ['card','momo','bank-transfer','cash-on-delivery'],
      required: true
    }

  },

  status: {
    type: String,
    enum: ['editing','ready-for-payment'],
    default: 'editing'
  }
  
},
{ timestamps: true }
);

export default mongoose.model('CheckoutDetails', CheckoutDetailsSchema);
