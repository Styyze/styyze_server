import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import authRoute from './routes/auth.js';

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

// Function to check origin
function checkOrigin(origin) {
    const allowedOrigins = ["//localhost", "//styyze-server.onrender.com", "//styyze.vercel.app"];
    if (!origin) {
        console.log('No origin specified, allowing connection for development.');
        return true; // Allow connection if origin is undefined
    }
    return allowedOrigins.includes(new URL(origin).origin);
}

// Set up WebSocket server
const wsServer = new WebSocketServer({ port: 8080 });
let clients = new Map();

function heartbeat() {
    this.isAlive = true;
}

wsServer.on('connection', (ws, req) => {
    console.log('New connection from', req.socket.remoteAddress);

    const origin = req.headers.origin;
    if (!checkOrigin(origin)) {
        console.log('Connection from invalid origin:', origin);
        ws.close(1008, 'Forbidden'); // Use a valid close code
        return;
    }

    ws.isAlive = true;
    ws.on('pong', heartbeat);

    const id = uuidv4();
    clients.set(id, ws);
    ws.id = id;

    // Send the assigned ID to the client
    ws.send(JSON.stringify({ clientId: id }));

    ws.on('close', () => {
        console.log('Connection closed for', id);
        clients.delete(id);
    });

    ws.on('message', (message) => {
        console.log(`Message from ${id}: ${message}`);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
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
    origin: [
        'http://localhost:3000',
        'https://styyze.vercel.app/',
        'http://styyze-server.onrender.com:8080',
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

const interval = setInterval(() => {
    wsServer.clients.forEach((ws) => {
        if (!ws.isAlive) return ws.terminate();

        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wsServer.on('close', () => {
    clearInterval(interval);
});

// Start server
app.listen(5000, () => {
    connect();
    console.log('Connected to server');
    console.log('WebSocket server is running on ws://localhost:8080');
});
