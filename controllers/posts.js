// controllers/post.js
import Post from '../models/Post.js';

export const post = async (req, res, next) => {
    try {
        const { userId, postData, clientId } = req.body;
    console.log(clientId);

    const { caption, file, location, tags } = postData;

    const newPost = new Post({
        userId,
        postData: {
            caption,
            file,
            location,
            tags
        }
    });
        await newPost.save();

        // Notify the client about the new post
        req.io.to(clientId).emit('new post', newPost);

        console.log(`New post created by userId: ${req.body.userId}`);
        console.log(`Socket.IO client: ${Array.from(req.io.sockets.sockets.keys())}`);

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