import Like from '../models/Like.js';
import Post from '../models/Post.js';

export const like = async (req, res, next) => {

    const { postId, userId } = req.body;

    if (!postId || !userId) {
        return res.status(400).send({ message: "Missing postId or userId." });
    }

    try {
        const likeExists = await Like.findOne({ userId, postId });

        if (likeExists) {
            // If already liked, unlike the post
            await Like.deleteOne({ userId, postId });
            await Post.findByIdAndUpdate(postId, { $inc: { likeCount: -1 } });
            res.status(200).send({ message: "Post unliked." });
        } else {
            // If not liked, like the post
            await Like.create({ userId, postId });
            await Post.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } });
            res.status(200).send({ message: "Post liked." });
            console.log("Liked!")
        }
    } catch (error) {
        console.error("Error toggling like:", error);
        res.status(500).send({ message: "Internal server error." });
    }

}

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
