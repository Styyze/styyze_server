import mongoose from "mongoose";

const { Schema } = mongoose;

const quoteSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true, // One quote per project
      index: true,
    },

    houseId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      min: 0,
      default: null,
    },

    status: {
      type: String,
      enum: [ "awaiting_house","quoted","accepted","declined",],
      default: "awaiting_house",
      index: true,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Quote", quoteSchema);