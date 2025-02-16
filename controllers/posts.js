// controllers/post.js
import Post from '../models/Post.js';

export const post = async (req, res, next) => {
    try {
        const newPost = new Post({
            userId: req.body.userId,
            content: req.body.content,
            media: req.body.media
        });

        await newPost.save();

        // Notify all clients about the new post using Socket.IO
        req.io.emit('newPost', newPost);

        console.log(`New post created by userId: ${req.body.userId}`);
        console.log(`Socket.IO clients: ${Array.from(req.io.sockets.sockets.keys())}`);

        res.status(200).send({
            success: true,
            message: "Post successfully saved!",
            data: newPost
        });
    } catch (err) {
        console.log(err);
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