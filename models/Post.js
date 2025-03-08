import mongoose from 'mongoose';

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
    media: [{
        type: {
            type: String,
            enum: ['image', 'video', 'emoji'],
            required: false,
        },
        url: {
            type: String,
            required: false,
        },
        altText: String,
    }],
    location: {
        type: {
            lat: {
                type: Number,
                required: false,
            },
            lng: {
                type: Number,
                required: false,
            }
        },
        required: false,
    },
    tags: [{
        type: String,
        trim: true,
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Post = mongoose.model('Post', PostSchema);

export default Post;
