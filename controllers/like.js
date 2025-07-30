import Post from '../models/Post.js';
import mongoose from 'mongoose';
import User from '../models/Users.js'

export const like = async (req, res, next) => {
    const { postId, userId } = req.body;
    console.log("userId:",userId);

    // Validate input
    if (!postId || !userId) {
        return res.status(400).send({ message: "Missing postId or userId." });
    }

    try {
        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send({ message: "Invalid postId or userId." });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send({ message: "User not found." });
        }

        // Find the post
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).send({ message: "Post not found." });
        }

        // Check if user already liked the post
const likeExists = Array.isArray(post.likes) && post.likes.some(like => like.userId.toString() === userId);

        if (likeExists) {
            // Unlike: Remove userId from likes array and decrement likeCount
            await Post.findByIdAndUpdate(postId, {
                $pull: { likes: { userId } },
                $inc: { likeCount: -1 }
            });
            res.status(200).send({ message: "Post unliked." });
        } else {
            // Like: Add userId to likes array and increment likeCount
            await Post.findByIdAndUpdate(postId, {
                $push: { likes: { userId } },
                $inc: { likeCount: 1 }
            });
            res.status(200).send({ message: "Post liked." });
            console.log("Liked!");
        }
    } catch (error) {
        console.error("Error toggling like:", error);
        res.status(500).send({ message: "Internal server error.", error: error.message });
    }
};

export const getAllLike = async (req, res, next) => {

    const { postId } = req.query;

    if (!postId) {
        return res.status(400).send({ message: "Missing postId." });
    }

    try {
        // Fetch all likes for the post
        const likes = await Like.find({ post: postId });
        const userIds = likes.map((like) => like.userId.toString());
        const likeCount = userIds.length;

        res.status(200).send({ userIds, likeCount });
    } catch (error) {
        console.error("Error fetching likes:", error);
        res.status(500).send({ message: "Internal server error." });
    }
}
