// controllers/post.js
import Post from '../models/Post.js';
import mongoose from 'mongoose';
import User from '../models/Users.js'


export const post = async (req, res, next) => {
    try {
        const {userId,caption,location, media,tags, clientId}= req.body;
    console.log(clientId);


    const newPost = new Post({
        userId,
        media,
        caption,
        location,
        tags
        
    });
        await newPost.save();

        // Notify the client about the new post
        req.io.to(clientId).emit('new post', newPost);

        console.log(`New post created by userId: ${userId}`);
        console.log(`Socket.IO client: ${Array.from(req.io.sockets.sockets.keys())}`);

        res.status(200).send({
            success: true,
            message: "Post successfully saved!",
            data: newPost
        });
    } catch (err) {
        console.error("Error saving post", err);
        res.status(500).send({
            success: false,
            message: 'There was an error processing your request',
            error: err.message,
        });
    }
};

//Get all posts
export const getPosts= async (req,res,next)=>{
    try{
        const posts= await Post.find()
        res.status(200).json(posts)
        }catch(err){
            next(err)
        }
}

export const getUserPosts= async(req, res, next)=>{
    const {userId}=req.params;
 try {
        const posts = await Post.find({ userId: userId }); // Fetch all matching documents

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No posts found for this user"
            });
            }
            res.status(200).json({
            success: true,
            data: posts
        });
        
        }catch(err){
       console.error("Error saving post", err);
       console.error(err.stack || err)
        res.status(500).send({
            success: false,
            message: 'There was an error processing your request',
            error: err.message,
        });    }
}

export const getUsersWhoLikedPost = async (req, res)=> {
    const { postId } = req.params;

    try {
        const post = await Post.findById(postId)
            .populate({
                path: 'likes.userId', 
                populate: {
                    path: 'userProfile', 
                    select: 'avatarUrl' 
                },
                select: 'username email userProfile' 
            })
            .select('likes'); 

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Format the response
        const usersWhoLiked = post.likes.map(like => ({
            userId: like.userId._id,
            username: like.userId.username,
            email: like.userId.email,
            avatarUrl: like.userId.userProfile ? like.userId.userProfile.avatarUrl : null
        }));

        res.status(200).json({ data: usersWhoLiked });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}