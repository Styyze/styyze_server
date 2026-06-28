import mongoose from 'mongoose';


const LikeSchema = new mongoose.Schema({

    userId: {
         type: mongoose.Schema.Types.ObjectId, 
         ref: "User"
         },
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true
    },

    postId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Post"
     },
    createdAt: { type: Date, default: Date.now }
  });

  const Like = mongoose.model('Like', LikeSchema);
  
  export default Like;