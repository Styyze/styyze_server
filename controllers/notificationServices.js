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


        // ==========================================
        // DETERMINE RECIPIENT ROOM
        // ==========================================

        const room = `user_${recipientId.toString()}`;

        console.log(
            "Notification room:",
            room
        );


        // ==========================================
        // CHECK SOCKETS IN THE ROOM
        // ==========================================

        const socketsInRoom = await io
            .in(room)
            .fetchSockets();

        console.log(
            `Sockets in ${room}:`,
            socketsInRoom.length
        );


        if (socketsInRoom.length === 0) {

            console.warn(
                `⚠️ No connected sockets found in room: ${room}`
            );

        } else {

            console.log(
                `✅ Found ${socketsInRoom.length} socket(s) in room.`
            );

            socketsInRoom.forEach((socket) => {

                console.log(
                    "Socket ID:",
                    socket.id
                );

            });
        }


        // ==========================================
        // EMIT NOTIFICATION
        // ==========================================

        console.log(
            `📡 Emitting notification:new to ${room}`
        );

        io.to(room).emit(
            "notification:new",
            notification
        );

        console.log(
            `✅ notification:new emitted to ${room}`
        );

        console.log("======================================");


    } catch (error) {

        console.error(
            "❌ Real-time notification delivery failed:"
        );

        console.error(error);

    }


    return notification;
};