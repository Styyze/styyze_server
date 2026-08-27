import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";

let io;

export const initializeSocket = (server) => {

    io = new Server(server, {

        cors: {
            origin: [
                "http://localhost:3000",
                "http://localhost:5173",
                "https://styyze.vercel.app",
                "https://styyze.com",
                "https://www.styyze.com"
            ],

            credentials: true
        }

    });


    io.use((socket, next) => {

        try {

            const cookies = cookie.parse(
                socket.handshake.headers.cookie || ""
            );

            const token =
                cookies.access_token;

            if (!token) {

                return next(
                    new Error(
                        "Authentication token required"
                    )
                );

            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            socket.userId =
                decoded.id;

            next();

        } catch (error) {

            console.error(
                "Socket authentication error:",
                error.message
            );

            next(
                new Error(
                    "Invalid authentication token"
                )
            );

        }

    });


    io.on("connection", (socket) => {

        const userId =
            socket.userId.toString();

        const room =
            `user_${userId}`;

        
        console.log(
            "SOCKET CONNECTED from socket.io"
        );

        console.log(
            "User:",
            userId
        );

        console.log(
            "Socket:",
            socket.id
        );

        console.log(
            "Room:",
            room
        );

        


        socket.join(room);


        socket.on("disconnect", () => {

            console.log(
                `Socket disconnected: ${userId}`
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