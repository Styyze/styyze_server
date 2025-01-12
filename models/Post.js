import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        trim: true,
        default: '', 
    },
    media: [{
         type: { type: String,
             enum: ['image', 'video', 'emoji'], 
             required: false, 
            }, 
    url: { type: String,
         required: false,
         },
     altText: String, }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Post = mongoose.model('Post', PostSchema);

export default Post;
