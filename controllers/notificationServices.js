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

    // Always save notification
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
 try {
        const io = getIO();

        io.to(`user_${recipientId.toString()}`).emit(
            "notification:new",
            notification
        );

    } catch (error) {
        console.error(
            "Real-time notification delivery failed:",
            error.message
        );




        
    }

    return notification;

};