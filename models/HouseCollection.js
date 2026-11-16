
import mongoose from "mongoose";

const CollectionSchema = new mongoose.Schema(
  {
    houseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "House",
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true,
      default: ""
    },

    coverImage: {
      type: String,
      default: ""
    },

    productIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      }
    ]
  },
  {
    timestamps: true
  }
);

CollectionSchema.index(
  { houseId: 1, name: 1 },
  { unique: true }
);

const Collection = mongoose.model(
  "Collection",
  CollectionSchema
);

export default Collection;