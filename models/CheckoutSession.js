import mongoose from 'mongoose';

const CheckoutSessionSchema = new mongoose.Schema({
  preorderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PreOrder',
    required: false
  },

  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project', 
    required: false
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
    enum: ['pending', 'success', 'failed', 'cancelled'],
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

CheckoutSessionSchema.pre('validate', function(next) {
  if (!this.preorderId && !this.projectId) {
    return next(new Error('A checkout session must have either a preorderId or a projectId.'));
  }
  next();
});

export default mongoose.model('CheckoutSession', CheckoutSessionSchema);