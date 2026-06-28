import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
    mediaUrl: { type: String, required: false },
    mediaId: { type: String, required: false }
});

const brandTagSchema = new mongoose.Schema({
    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
    avatarUrl: {
        type: String,
        default: ''
    }
}, { _id: false });

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

    brandsTagged: {
        type: [brandTagSchema],
        default: []
    },

    likeCount: { type: Number, default: 0 },
    repostCount: { type: Number, default: 0 },

    likes: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
   name: {
        type: String,
        trim: true
    },
    username: {
        type: String,
        trim: true
    },
    }],

    reposts: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
         name: {
        type: String,
        trim: true
    },
    username: {
        type: String,
        trim: true
    },
    }]

}, { timestamps: true });

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