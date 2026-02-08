import mongoose from 'mongoose';


//  MEDIA SUB SCHEMA 
const mediaSchema = new mongoose.Schema(
  {
    mediaUrl: {
      type: String,
      required: true,
      trim: true
    },
    mediaId: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);


// PRODUCT SCHEMA 
const ProductSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true 
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    media: {
      type: [mediaSchema],
      default: []
    },

    currency: {
      type: String,
      trim: true,
      default: 'NGN' 
    },

    size: {
      type: String,
      trim: true
    },

    color: {
      type: String,
      trim: true
    },

    category: {
      type: String,
      trim: true
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);



ProductSchema.index({ seller: 1 });



// Automatically determine availability
ProductSchema.virtual('isAvailable').get(function () {
  return this.stock > 0;
});



export default mongoose.model('Product', ProductSchema);
