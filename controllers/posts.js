// controllers/post.js
import Post from '../models/Post.js';
import WebSocket from 'ws';
export const post = async (req, res, next) => {
    try {
        const newPost = new Post({
            userId: req.body.userId, 
            content: req.body.content,
            media: req.body.media
        });

        await newPost.save();

        // Notify all clients about the new post
        req.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(newPost));
            }
        });
        console.log(`New post created by userId: ${req.body.userId}`);
         console.log(`WebSocket clients: ${Array.from(req.clients.keys())}`);
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
