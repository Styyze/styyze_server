
import mongoose from 'mongoose';


// MEDIA SUB SCHEMA
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


// PRODUCT SNAPSHOT SUB SCHEMA
const collectionProductSchema = new mongoose.Schema(
  {
    // Reference to the original product
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
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
      type: [String],
      default: []
    },

    color: {
      type: [String],
      default: []
    },

    category: {
      type: String,
      trim: true
    },

    stock: {
      type: Number,
      default: 0,
      min: 0
    },

    // Product lifecycle status
    status: {
      type: String,
      enum: ['active', 'out_of_stock', 'deleted'],
      default: 'active'
    },

    // When the product was added to the collection
    addedAt: {
      type: Date,
      default: Date.now
    },

    // When the product was deleted from the house
    deletedAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);


const CollectionSchema = new mongoose.Schema(
  {
    houseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'House',
      required: true,
      index: true
    },

    products: {
      type: [collectionProductSchema],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


CollectionSchema.index({ house: 1 }, { unique: true });


export default mongoose.model('Collection', CollectionSchema);
