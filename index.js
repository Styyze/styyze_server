import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import authRoute from './routes/auth.js';
import postRoute from './routes/posts.js';
import loginRoute from './routes/login.js';

import searchPostpostRoute from './routes/searchPost.js';


const app = express();
dotenv.config();

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

// Set up WebSocket server
const wsServer = new WebSocketServer({ port: 8080 });
let clients = new Map();

wsServer.on('connection', (ws) => {
    const id = uuidv4();
    clients.set(id, ws);
    ws.id = id;

    // Send the assigned ID to the client
    ws.send(JSON.stringify({ clientId: id }));

    ws.on('close', () => {
        clients.delete(id);
    });

    ws.on('message', (message) => {
        console.log(`index.js message: ${message}`);
    });
});

// Middleware to pass WebSocket clients map
app.use((req, res, next) => {
    req.clients = clients;
    next();
});

// Middleware
app.use(cors({
    credentials: true,
    origin: ['http://localhost:3000','https://styyze.vercel.app/'],
    methods: ["GET", "POST", "DELETE", "PUT"]
}));
app.use(express.json());
app.use(cookieParser());
app.options('*', cors());

// Routes
app.use("/api/auth", authRoute);
app.use("/api", loginRoute); 
app.use("/api", postRoute); 
app.use("/api",searchPostpostRoute)

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

// Start server
app.listen(5000, () => {
    connect();
    console.log('Connected to server');
    console.log('WebSocket server is running on ws://localhost:8080');
});

