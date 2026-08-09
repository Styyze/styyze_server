import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      "Please provide a valid email address",
    ],
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId;
    },
    validate: {
      validator: function (v) {
        if (!v && this.googleId) return true; 
        return v && v.length >= 8;
      },
      message: "Password must be at least 8 characters long",
    },
  },
  googleId: { type: String, unique: true, sparse: true },
  authProvider: { type: String, default: 'local' },
  userProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProfile', 
    required: false 
  },
  verified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    default: 'buyer'
  },
  createdAt: { 
    type: Date,
    default: Date.now, 
    immutable: true, 
  }
});

UserSchema.index({ email: 1 }, { unique: true });

export default mongoose.model("User", UserSchema);