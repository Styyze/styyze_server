import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';

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
            "https://live-stream-dy6l.onrender.com"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(cors({ origin: '*', credentials: true }));

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

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

// Start server
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
