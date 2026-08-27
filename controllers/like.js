import Post from '../models/Post.js';
import mongoose from 'mongoose';
import User from '../models/Users.js'
import {createNotification } from './notificationServices.js';

export const like = async (req, res, next) => {
    const { postId, userId } = req.body;

    
    if (!postId || !userId) {
        return res.status(400).json({
            message: "Missing postId or userId."
        });
    }

    try {

        if (
            !mongoose.Types.ObjectId.isValid(postId) ||
            !mongoose.Types.ObjectId.isValid(userId)
        ) {
            return res.status(400).json({
                message: "Invalid postId or userId."
            });
        }


        const user = await User.findById(userId)
            .select("_id username name");

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                message: "Post not found."
            });
        }

        const likeExists =
            Array.isArray(post.likes) &&
            post.likes.some(
                like =>
                    like.userId &&
                    like.userId.toString() === userId.toString()
            );


        if (likeExists) {

            await Post.findByIdAndUpdate(
                postId,
                {
                    $pull: {
                        likes: {
                            userId: user._id
                        }
                    },
                    $inc: {
                        likeCount: -1
                    }
                }
            );

            console.log(
                `Post ${postId} unliked by user ${userId}`
            );

    
            return res.status(200).json({
                message: "Post unliked.",
                liked: false
            });
        }

        await Post.findByIdAndUpdate(
            postId,
            {
                $push: {
                    likes: {
                        userId: user._id,
                        name: user.name,
                        username: user.username
                    }
                },
                $inc: {
                    likeCount: 1
                }
            }
        );

        console.log(
            `Post ${postId} liked by user ${userId}`
        );


        if (
            post.userId &&
            post.userId.toString() !== user._id.toString()
        ) {

            console.log("======================================");
            console.log("CREATING LIKE NOTIFICATION");
            console.log("Post ID:", post._id.toString());
            console.log("Post Owner:", post.userId.toString());
            console.log("Liker ID:", user._id.toString());
            console.log("Liker Username:", user.username);
            console.log(
                "Notification Room:",
                `user_${post.userId.toString()}`
            );
            console.log("======================================");


            await createNotification({

                recipientId: post.userId,

                type: "like",

                title: `@${user.username} liked your Styyze`,

                body: `@${user.username} liked your Styyze`,
                meta: {
                    postId: post._id,
                    likerId: user._id,
                    likerName: user.username
                },

                actionUrl: `/post/${post._id}`
            });


            console.log(
                "Like notification created successfully."
            );

        } else {

            console.log(
                "User liked their own post. No notification created."
            );
        }

        return res.status(200).json({
            message: "Post liked.",
            liked: true
        });


    } catch (error) {

        console.error(
            "Error toggling like:",
            error
        );

        return res.status(500).json({
            message: "Internal server error.",
            error: error.message
        });
    }
};
export const getAllLike = async (req, res, next) => {

    const { postId } = req.query;

    if (!postId) {
        return res.status(400).send({ 
            message: "Missing postId." 
        });
    }

    try {

        const post = await Post.findById(postId)
            .select("likes likeCount");

        if (!post) {
            return res.status(404).send({
                message: "Post not found."
            });
        }


        res.status(200).send({ 
            likes: post.likes,
            likeCount: post.likeCount
        });

    } catch (error) {

        console.error("Error fetching likes:", error);

        res.status(500).send({ 
            message: "Internal server error." 
        });
    }
}