import express from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

import { initializeSocket } from "./websocket/socket.js";



import loginRoute from "./routes/auth.js";
import registerRoute from "./routes/auth.js";
import usersRoute from "./routes/users.js";
import getUserProfileRoute from "./routes/getUserProfile.js";
import updateUserProfileRoute from "./routes/updateUserProfile.js";
import postRoute from "./routes/posts.js";
import postVideoRoute from "./routes/getVideos.js";
import userProfileRoute from "./routes/userProfile.js";
import commentRoute from "./routes/comments.js";
import likeRoute from "./routes/like.js";
import followersRoute from "./routes/follow.js";
import searchPostRoute from "./routes/searchPost.js";
import searchUserRoute from "./routes/search_user.js";
import savePostRoute from "./routes/savePost.js";
import messageRoute from "./routes/message.js";
import orderRoute from "./routes/order.js";
import productRoute from "./routes/product.js";
import allProductsRoute from "./routes/getAllProducts.js";
import verifyRoute from "./routes/verifyUser.js";
import createCartItemsRoute from "./routes/cart.js";
import verifyPaymentRoute from "./routes/verifyPayment.js";
import createMeasurementRoute from "./routes/customOrder.js";
import priceListRoute from "./routes/pricelist.js";
import projectRoute from "./routes/project.js";
import houseMembershipRoute from "./routes/houseMembership.js";
import acceptStaffInvitationRoute from "./routes/acceptInvitation.js";
import GarmentTypeRoute from "./routes/garmentType.js";
import quoteRoute from "./routes/quote.js";
import tapeMeasurementRoute from "./routes/tapeMeasurement.js";



dotenv.config();

const app = express();




const connect = async () => {
    try {

        await mongoose.connect(process.env.MONGO);

        console.log("Connected to MongoDB");

    } catch (error) {

        console.error(
            "MongoDB connection error:",
            error
        );

        throw error;
    }
};


mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected!");
});


mongoose.connection.on("error", (error) => {
    console.error(
        "MongoDB connection error:",
        error
    );
});




const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",

    "https://styyze.vercel.app",

    "https://sarto-b5x7.onrender.com",
    "https://styyze-server.onrender.com",
    "https://styzze-ai-model.onrender.com",
    "https://styyzeserver-production.up.railway.app",
    "https://styyze-ai-service-production.up.railway.app",

    "https://live-stream-dy6l.onrender.com",
    "https://lively-dieffenbachia-377cfd.netlify.app",

    "https://styyze.com",
    "https://www.styyze.com",

    "www.styyze.com"
];


app.use(
    cors({

        origin: (origin, callback) => {

            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.log(
                "Blocked CORS origin:",
                origin
            );

            return callback(
                new Error("Not allowed by CORS")
            );
        },

        credentials: true,

        methods: [
            "GET",
            "POST",
            "DELETE",
            "PUT",
            "PATCH",
            "OPTIONS"
        ]
    })
);



app.use(
    express.json({

        verify: (req, res, buf) => {
            req.rawBody = buf;
        }

    })
);


app.use(cookieParser());



const httpServer = createServer(app);




initializeSocket(httpServer);



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

app.use("/api/", searchPostRoute);

app.use("/api/", searchUserRoute);

app.use("/api/", savePostRoute);

app.use("/api/message", messageRoute);

app.use("/api/product", productRoute);

app.use("/api/product", orderRoute);

app.use("/api/products", allProductsRoute);

app.use("/api/user", verifyRoute);

app.use("/api/cart", createCartItemsRoute);

app.use("/api/payment", verifyPaymentRoute);

app.use("/api/", createMeasurementRoute);

app.use("/api/", priceListRoute);

app.use("/api/", projectRoute);

app.use("/api/", houseMembershipRoute);

app.use("/api/", acceptStaffInvitationRoute);

app.use("/api/", GarmentTypeRoute);

app.use("/api/", quoteRoute);

app.use("/api/", tapeMeasurementRoute);



app.use((req, res) => {

    return res.status(404).json({

        success: false,

        status: 404,

        message: "Route not found"

    });
});




app.use((err, req, res, next) => {

    console.error(
        "Server Error:",
        err
    );


    const status =
        err.status || 500;


    const message =
        process.env.NODE_ENV === "production" &&
        status === 500

            ? "Internal server error"

            : err.message ||
              "Something went wrong";


    return res.status(status).json({

        success: false,

        status,

        message,

        ...(process.env.NODE_ENV !== "production" && {
            stack: err.stack
        })

    });
});




const PORT =
    process.env.PORT || 5000;


const startServer = async () => {

    try {

        await connect();


        
        httpServer.listen(
            PORT,
            () => {

                console.log(
                    `Server is running on port ${PORT}`
                );

                
                

                console.log(
                    `Socket.IO server initialized`
                );

            }
        );

    } catch (error) {

        console.error(
            "Failed to start server:",
            error
        );

        process.exit(1);
    }
};



startServer();