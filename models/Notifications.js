import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        type: {
            type: String,
            enum: [
                "follow",
                "like",
                "comment",
                "mention",

                "staff_invite",
                "project_received",
                "quote_sent",
                "quote_accepted",
                "quote_declined",
                "project_update",
                "order_placed",
                "order_update",
                "payment_received"
            ],
            required: true
        },

        title: {
            type: String,
            required: true
        },

        body: {
            type: String,
            required: true
        },

        read: {
            type: Boolean,
            default: false
        },

        requiresAction: {
            type: Boolean,
            default: false
        },

        actionResolved: {
            type: Boolean,
            default: false
        },

        actionUrl: {
            type: String,
            default: null
        },

        meta: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

// Required indexes from your brief
notificationSchema.index({
    recipientId: 1,
    createdAt: -1
});

notificationSchema.index({
    recipientId: 1,
    read: 1,
    createdAt: -1
});

notificationSchema.index({
    recipientId: 1,
    type: 1,
    createdAt: -1
});

const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

export default Notification;