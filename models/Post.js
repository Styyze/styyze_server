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
        file: [String],
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
});

const Post = mongoose.model('Post', PostSchema);

export default Post;
