import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { createServer } from 'http';
import authRoute from './routes/auth.js';
import followRoute from './routes/follow.js';
import unfollowRoute from './routes/unfollow.js';
import postRoute from './routes/posts.js';
import usersRoute from './routes/users.js';
import userProfileRoute from './routes/userProfile.js';
import getUserProfileRoute from './routes/getUserProfile.js';
import updateUserProfileRoute from './routes/updateUserProfile.js';
import likeRoute from './routes/like.js';
import unLikeRoute from './routes/unLike.js';


dotenv.config();

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 5000;

const io = new Server(httpServer, {
    cors: {
        origin: [
            'http://localhost:3000',
            'https://styyze.vercel.app',
            'https://styyze-server.onrender.com',
        ],
        methods: ["GET", "POST","PATCH","PUT","DELETE"],
        credentials: true 
    }
});

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); 
    }
};

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected!');
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Middleware to pass Socket.IO clients
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Middleware
app.use(cors({
    credentials: true,
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://styyze.vercel.app',
        'https://styyze-server.onrender.com'
    ],
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"]
}));
app.use(express.json());
app.use(cookieParser());
app.options('*', cors());

// Routes
app.use("/api", authRoute);
app.use("/api", followRoute);
app.use("/api", unfollowRoute);
app.use("/api", usersRoute);
app.use("/api", postRoute);
app.use("/api", userProfileRoute);
app.use("/api", getUserProfileRoute);
app.use("/api", updateUserProfileRoute);
app.use("/api", likeRoute);
app.use("/api", unLikeRoute);

// Error handling middleware
app.use((err, req, res, next) => {
    const errStatus = err.status || 500;
    const errMessage = err.message || 'Something went wrong';

    return res.status(errStatus).json({
        success: false,
        status: errStatus,
        message: errMessage,
        stack: err.stack,
    });
});

// Socket.IO Connection
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Send client ID on connection
    socket.emit('clientId', { clientId: socket.id });

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

    // Handle disconnections
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error('Socket.IO error:', error);
    });
});


// Start server
connect().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log('Socket.IO server is running');
    });
}).catch(err => {
    console.error('Failed to start server:', err);
});