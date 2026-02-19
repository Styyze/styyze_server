import mongoose from 'mongoose';

const CheckoutSessionSchema = new mongoose.Schema({

  preorderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PreOrder',
    required: true
  },

  paymentProvider: String,

  paymentReference: String,

  paymentStatus: {
    type: String,
    enum: ['pending','success','failed'],
    default: 'pending'
  },

  gatewayResponse: Object

},
{ timestamps: true });

export default mongoose.model('CheckoutSession', CheckoutSessionSchema);
