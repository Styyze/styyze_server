import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { createServer } from 'http';
import authRoute from './routes/auth.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [
            'http://localhost:3000',
            'https://styyze.vercel.app',
            'https://styyze-server.onrender.com',
        ],
        methods: ["GET", "POST"],
        credentials: true 
    }
});

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO);
        console.log('Connected to MongoDB');
    } catch (error) {
        throw error;
    }
};

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected!');
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
        'https://styyze.vercel.app',
        'https://styyze-server.onrender.com'
    ],
    methods: ["GET", "POST", "DELETE", "PUT"]
}));
app.use(express.json());
app.use(cookieParser());
app.options('*', cors());

// Routes
app.use("/api", authRoute);

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

    // Send the assigned ID to the client
    socket.emit('clientId', { clientId: socket.id });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    socket.on('error', (error) => {
        console.error('Socket.IO error:', error);
    });
});

// Start server
httpServer.listen(5000, () => {
    connect();
    console.log('Connected to server');
    console.log('Socket.IO server is running on port 5000');
});
