import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true
        }
    });

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(
                    new Error("Authentication token required")
                );
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            socket.userId = decoded.id;

            next();

        } catch (error) {
            next(new Error("Invalid authentication token"));
        }
    });

    io.on("connection", (socket) => {
        console.log(
            `User connected: ${socket.userId}`
        );

        
        socket.join(`user_${socket.userId}`);

        socket.on("disconnect", () => {
            console.log(
                `User disconnected: ${socket.userId}`
            );
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error(
            "Socket.IO has not been initialized"
        );
    }

    return io;
};