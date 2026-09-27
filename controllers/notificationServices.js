import Notification from "../models/Notifications.js";
import { getIO } from "../websocket/socket.js";

export const createNotification = async ({
    recipientId,
    type,
    title,
    body,
    meta = {},
    actionUrl = null,
    requiresAction = false
}) => {

    const notification = await Notification.create({
        recipientId,
        type,
        title,
        body,
        meta,
        actionUrl,
        requiresAction,
        actionResolved: false,
        read: false
    });

    console.log("======================================");
    console.log("NOTIFICATION CREATED");
    console.log("Notification ID:", notification._id.toString());
    console.log("Recipient ID:", recipientId.toString());
    console.log("Notification type:", type);


    // ==========================================
    // REAL-TIME SOCKET NOTIFICATION
    // ==========================================

    try {

        const io = getIO();

        if (!io) {
            console.error(
                "❌ Socket.IO instance is not available."
            );

            return notification;
        }

        console.log(
            "✅ Socket.IO instance obtained."
        );


        
        const room = `user_${recipientId.toString()}`;

        console.log(
            "Notification room:",
            room
        );


        

        const socketsInRoom = await io
            .in(room)
            .fetchSockets();

        console.log(
            `Sockets in ${room}:`,
            socketsInRoom.length
        );


        if (socketsInRoom.length === 0) {

            console.warn(
                ` No connected sockets found in room: ${room}`
            );

        } else {

            console.log(
                `Found ${socketsInRoom.length} socket(s) in room.`
            );

            socketsInRoom.forEach((socket) => {

                console.log(
                    "Socket ID:",
                    socket.id
                );

            });
        }


        
        console.log(
            ` Emitting notification:new to ${room}`
        );

        // 🔍 LOG THE WEBSOCKET DATA SENT TO CLIENT
        console.log("======================================");
        console.log("WEBSOCKET PAYLOAD (notification:new):");
        console.dir(notification.toObject ? notification.toObject() : notification, { depth: null, colors: true });
        console.log("======================================");

        io.to(room).emit(
            "notification:new",
            notification
        );

        console.log(
            ` notification:new emitted to ${room}`
        );



    } catch (error) {

        console.error(
            "Real-time notification delivery failed:"
        );

        console.error(error);

    }


    return notification;
};

// get notifications


export const getUserNotifications = async (req, res) => {
    try {
        const recipientId = req.user.id;

        const notifications = await Notification.find({
            recipientId
        })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: notifications.length,
            notifications
        });

    } catch (error) {
        console.error("Error fetching notifications:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};