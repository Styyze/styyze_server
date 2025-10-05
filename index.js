
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';

import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import loginRoute from './routes/auth.js';
import registerRoute from './routes/auth.js';
import usersRoute from './routes/users.js';
import getUserProfileRoute from './routes/getUserProfile.js';
import updateUserProfileRoute from "./routes/updateUserProfile.js";
import postRoute from './routes/posts.js'
import postVideoRoute from './routes/getVideos.js';
import userProfileRoute from './routes/userProfile.js';
import commentRoute from './routes/comments.js';
import likeRoute from './routes/like.js';
import followersRoute from './routes/follow.js';
import searchPostRoute from './routes/searchPost.js';
import searchUserRoute from './routes/search_user.js';
import savePostRoute from './routes/savePost.js';


const app= express();
dotenv.config();

const connect= async ()=>{
try{
    await mongoose.connect(process.env.MONGO);
    console.log('conncted to mongoDB');
}
catch(error){
    throw error;
}
};
mongoose.connection.on("disconnected", ()=>{
    console.log('MongoDB disconnected!');
});




app.use(cors({   
origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'https://styyze.vercel.app',
    'https://styyze-server.onrender.com'
],
credentials: true,
 methods:["GET","POST","DELETE","PUT","PATCH"]
}))

app.use(express.json())
app.use(cookieParser())


app.use((err,req,res,next)=>{
const errStatus= err.status || 500 
const errMessage= err.message || 'Something went wrong'

return res.status(errStatus).json({
    success:false,
    status:errStatus,
    message:errMessage,
    stack:err.stack,

});
})



const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

const io = new Server(httpServer, {
    cors: {
        origin: [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://styyze.vercel.app',
            'https://styyze-server.onrender.com',
            "https://live-stream-dy6l.onrender.com"
        ],
        methods: ["GET", "POST","PUT","DELETE", "PATCH"],
        credentials: true
    }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/", loginRoute);
app.use("/api/", registerRoute);
app.use("/api/", usersRoute);
app.use("/api/", getUserProfileRoute);
app.use("/api/", userProfileRoute);
app.use("/api/", likeRoute);
app.use("/api/", postRoute);
app.use("/api/", commentRoute);
app.use("/api/", followersRoute);
app.use("/api/", updateUserProfileRoute);
app.use("/api/", postVideoRoute);
app.use("/api/", searchPostRoute );
app.use("/api/", searchUserRoute );
app.use("/api/", savePostRoute);




// Middleware

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
      socket.emit('client-id', socket.id);

    // Handle WebRTC offer
    socket.on('offer', (data) => {
        console.log(`Offer received from ${socket.id}`);
        socket.broadcast.emit('offer', data);
    });

    // Handle WebRTC answer
    socket.on('answer', (data) => {
        console.log(`Answer received from ${socket.id}`);
        socket.broadcast.emit('answer', data);
    });

    // Handle ICE candidates
    socket.on('ice-candidate', (data) => {
        console.log(`ICE Candidate received from ${socket.id}`);
        socket.broadcast.emit('ice-candidate', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
connect();
// Start server
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
