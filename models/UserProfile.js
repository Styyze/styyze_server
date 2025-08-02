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
  },
  followersCount: { type: Number, default: 0 }, 
    followingCount: { type: Number, default: 0 },
    followers:[{
        userId:{type:mongoose.Schema.Types.ObjectId,
            ref:'User',
            required:true
        }
    }],
  following:[{
    userId:{type:mongoose.Schema.Types.ObjectId,
             ref: 'User',
             required:true
    }
  }]
 
});


export default mongoose.model("UserProfile", UserProfileSchema);
