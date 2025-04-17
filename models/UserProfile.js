import mongoose from 'mongoose';

const UserProfileSchema = new mongoose.Schema({
    id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
      },
    name: {
        type: String,
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
      bio: {
        type: String,
        
      },
  website: {
    type: String,
   
  },
  avatarUrl: {
    type: String,
    
  },
  coverPhotoUrl: {
    type: String,
    
  },
  location: {
    type: String,
  },
  joinedAt: {
    type: String,
  }
 
});


export default mongoose.model("UserProfile", UserProfileSchema);
