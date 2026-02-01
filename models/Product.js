import mongoose from 'mongoose';


const mediaSchema = new mongoose.Schema(
  {
    mediaUrl: String,
    mediaId: String
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    media: {
      type: [mediaSchema],
      default: []
    },
    currency: String,
    size: String,
    color: String,
    category: String,
    status: {
      type: String,
      enum: ['available', 'sold', 'draft'],
      default: 'available'
    }
  },
  { timestamps: true }
);

ProductSchema.index({ sellerId: 1 });

export default mongoose.model('Product', ProductSchema);
