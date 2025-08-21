// controllers/post.js
import Post from '../models/Post.js';
import mongoose from 'mongoose';
import User from '../models/Users.js'

import Comment from '../models/PostComments.js'


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


// Utility: Build nested comment tree per post
const buildCommentTrees = (comments) => {
  const trees = new Map(); // postId => [top-level comments]
  const commentMap = new Map();

  // Initialize map
  comments.forEach(comment => {
    comment.replies = [];
    commentMap.set(comment._id.toString(), comment);
  });

  // Build trees
  comments.forEach(comment => {
    const postId = comment.postId.toString();
    if (comment.parentCommentId) {
      const parent = commentMap.get(comment.parentCommentId.toString());
      if (parent) {
        parent.replies.push(comment);
      }
    } else {
      if (!trees.has(postId)) trees.set(postId, []);
      trees.get(postId).push(comment);
    }
  });

  return trees;
};

// Controller: Get all posts with nested comments
export const getPostsWithComments = async (req, res) => {
  try {
    // Fetch all posts with user and profile info
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'userId',
        select: 'name userProfile',
        model: 'User',
        populate: {
          path: 'userProfile',
          model: 'UserProfile',
          select: 'avatarUrl username'
        }
      })
      .populate({
        path: 'userProfile', 
        model: 'UserProfile',
        select: 'avatarUrl name username'
      })
      .lean();

    const postIds = posts.map(post => post._id);

    // Fetch all comments for these posts
    const allComments = await Comment.find({ postId: { $in: postIds } })
      .populate({
        path: 'userId',
        select: 'username userProfile',
        model: 'User',
        populate: {
          path: 'userProfile',
          model: 'UserProfile',
          select: 'avatarUrl name'
        }
      })
      .lean();

    // Build comment trees
    const commentTrees = buildCommentTrees(allComments);

    // Attach comments to posts
    const enrichedPosts = posts.map(post => ({
      ...post,
      comments: commentTrees.get(post._id.toString()) || []
    }));

    res.status(200).json({ data: enrichedPosts });
  } catch (error) {
    console.error('Error fetching posts with comments:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
};

// Get user posts
export const getUserPosts= async(req, res, next)=>{
    const {userId}=req.params;
    console.log("User Id", userId);
 try {
        const posts = await Post.find({ userId: userId }); 

        if (posts.length === 0) {
            return res.status(404).json({
                success: true,
                data: {}
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

export const updatePost = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const { caption, location, tags, media, clientId } = req.body;

        // Build update object dynamically to avoid overwriting unintended fields
        const updateFields = {};
        if (caption !== undefined) updateFields.caption = caption;
        if (location !== undefined) updateFields.location = location;
        if (tags !== undefined) updateFields.tags = tags;
        if (media !== undefined) updateFields.media = media;

        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { $set: updateFields },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).send({
                success: false,
                message: "Post not found",
            });
        }

 req.io.to(clientId).emit('post updated', updatedPost);
 
        console.log(`Post updated: ${postId}`);

        res.status(200).send({
            success: true,
            message: "Post successfully updated!",
            data: updatedPost,
        });
    } catch (err) {
        console.error("Error updating post", err);
        res.status(500).send({
            success: false,
            message: 'There was an error updating the post',
            error: err.message,
        });
    }
};

// Get Post by _id
export const getPostById = async (req, res, next) => {
    const { postId } = req.params;

    try {
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        res.status(200).json({
            success: true,
            data: post
        });
    } catch (err) {
        console.error("Error fetching post by ID", err);
        res.status(500).json({
            success: false,
            message: "There was an error retrieving the post",
            error: err.message
        });
    }
};
