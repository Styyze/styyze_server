import mongoose from 'mongoose'; 

const SavePostSchema = new mongoose.Schema({ 
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "User" 
  },
   postId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Post" 

   }, 
   postCreatorUserId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User"
   }, 
   createdAt: { 
    type: Date, 
    default: Date.now 
  } }, 
  { timestamps: true }); 
  
SavePostSchema.index({ userId: 1, postId: 1 }, { unique: true }); 

const SavedPost= mongoose.model('SavedPost', SavePostSchema); 

export default SavedPost;