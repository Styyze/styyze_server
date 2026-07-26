import mongoose from "mongoose";

const { Schema } = mongoose;

const houseSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      unique:true,
      trim: true,
      lowercase: true
    },

    description: {
      type: String,
      default: ""
    },

    address: {
      type: String,
      default: ""
    },

    phone: {
      type: String,
      default: ""
    },

    email: {
      type: String,
      default: ""
    },

    logo: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("House", houseSchema);