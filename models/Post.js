import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    postData: {
        caption: {
            type: String,
            trim: true,
            default: '',
        },
        file: [{
            url: {type:String},
            img_id:{type: String}
        }],
        location: {
            type: String,
            required: false,
            trim: true,             
        },
        tags: [{
            type: String,
            trim: true,
        }],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    likeCount: { type: Number, default: 0 }, 
    repostCount: { type: Number, default: 0 }
});

const Post = mongoose.model('Post', PostSchema);

export default Post;
