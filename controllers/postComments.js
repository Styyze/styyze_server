import express from 'express';
import mongoose from 'mongoose';
import Comment from '../models/PostComments.js';


// POST /comments
export const postComments= async (req, res) => {
  try {
    const { postId, userId, content, parentCommentId } = req.body;

    // Validate required fields
    if (!postId || !userId || !content) {
      return res.status(400).json({ error: 'postId, userId, and content are required.' });
    }

    // Create new comment
    const newComment = new Comment({
      postId: new mongoose.Types.ObjectId(postId), 
      userId: new mongoose.Types.ObjectId(userId), 
      content: content.trim(),
      parentCommentId: parentCommentId ? new mongoose.Types.ObjectId(parentCommentId) : null
    })
    await newComment.save();
    await createNotification({
    recipientId: post.userId,

    type: "comment",

    title: `@${req.user.username} commented on your post`,

    body: comment.text,

    meta: {
        postId: post._id,
        commentId: comment._id,
        commenterName: req.user.username,
        preview: comment.text
    },

    actionUrl: `/post/${post._id}`
});
console.log("commented successfully")
    res.status(201).json({ message: 'Comment saved successfully.', comment: newComment });
  } catch (error) {
    console.error('Error saving comment:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

