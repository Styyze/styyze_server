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
  },
  password: {
    type: String,
    required: true,
  },
  userProfile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserProfile', 
        required: false 
    },
  createdAt: { 
    type: Date,
    default: Date.now, 
    immutable: true, 
  }
});

UserSchema.index({ email: 1 }, { unique: true });

export default mongoose.model("User", UserSchema);
