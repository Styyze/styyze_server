import mongoose from 'mongoose';

const mediaSchema= new mongoose.Schema({
    mediaUrl:{type: String, required: false},
    mediaId: {type:String, required: false}
});
const PostSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    
        caption: {
            type: String,
            trim: true,
            default: '',
        },
        media: {
            type: [mediaSchema]

        },
        location: {
            type: String,
            required: false,
            trim: true,             
        },
        tags: [{
            type: String,
            trim: true,
        }],
    
    
    likeCount: { type: Number, default: 0 }, 
    repostCount: { type: Number, default: 0 },
    likes:[{
        userId:{type:mongoose.Schema.Types.ObjectId,
            ref:'User',
            required:true
        }
    }],
    reposts:[{
        userId:{type:mongoose.Schema.Types.ObjectId,
            ref:'User',
            required:true
        }
    }]

},  { timestamps: true });

PostSchema.virtual('userProfile', {
  ref: 'UserProfile',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true,
});

PostSchema.set('toObject', { virtuals: true });
PostSchema.set('toJSON', { virtuals: true });

const Post = mongoose.model('Post', PostSchema);

export default Post;
