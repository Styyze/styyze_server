import Message from '../models/Message.js';
import UserProfile from '../models/UserProfile.js';

export const getUserMessagesById = async (req, res, next) => {
  const { conversationId} = req.params;
  try {
    if (!conversationId)
    {
       return  res.status(400).json({success: false, message: "ConversationId is Required"})
    }
    const messages = await Message.find({conversationId:conversationId})
    .sort({createdAt: -1 });

    if (messages.length === 0){
        return res.status(404).json({success: false, message: "No message for this user"});
    }
    return res.status(200).json({success: true, data:messages});
  }catch(err){
console.log(' error:', err);
return res.status(500).json({
    success:false,
    message: err.message
})
  }
}

export const getUserChatList = async (req, res) => {
  const { userId: currentUserId } = req.params;

  try {
    if (!currentUserId) {
      return res.status(400).json({
        success: false,
        message: "UserId is required",
      });
    }

    //  Get all messages involving the user (latest first)
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId },
        { receiverId: currentUserId },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!messages.length) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    //  Keep ONLY the last message per other user
    const lastMessagesMap = new Map();

    for (const msg of messages) {
      const otherUserId =
        String(msg.senderId) === String(currentUserId)
          ? String(msg.receiverId)
          : String(msg.senderId);

      // Since messages are sorted DESC, first one is the latest
      if (!lastMessagesMap.has(otherUserId)) {
        lastMessagesMap.set(otherUserId, msg);
      }
    }

    const lastMessages = Array.from(lastMessagesMap.values());

    // Fetch profiles of the other users
    const otherUserIds = lastMessages.map(msg =>
      String(msg.senderId) === String(currentUserId)
        ? msg.receiverId
        : msg.senderId
    );

    const profiles = await UserProfile.find({
      userId: { $in: otherUserIds },
    })
      .select("userId username name avatarUrl bio website coverPhotoUrl location")
      .lean();

    // Attach sender / receiver info properly
    const enrichedChatList = lastMessages.map(msg => {
      const isSender = String(msg.senderId) === String(currentUserId);
      const otherUserId = isSender ? msg.receiverId : msg.senderId;

      const otherUserProfile = profiles.find(
        p => String(p.userId) === String(otherUserId)
      );

      return {
        _id: msg._id,
        lastMessage: msg.content,        // 👈 change to your field name
        createdAt: msg.createdAt,
        senderId: msg.senderId,
        receiverId: msg.receiverId,

        senderProfile: isSender ? null : otherUserProfile || null,
        receiverProfile: isSender ? otherUserProfile || null : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: enrichedChatList,
    });
  } catch (err) {
    console.error("error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

