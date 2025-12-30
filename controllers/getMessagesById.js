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
  console.log('currentUserId:', currentUserId);

  try {
    if (!currentUserId) {
      return res.status(400).json({
        success: false,
        message: "UserId is required"
      });
    }

    // Fetch messages where user is sender OR receiver
    const chatList = await Message.find({
      $or: [
        { senderId: currentUserId },
        { receiverId: currentUserId }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    if (chatList.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No chats found for this user"
      });
    }

    const profileUserIds = chatList.map(msg =>
      String(msg.senderId) === String(currentUserId)
        ? msg.receiverId
        : msg.senderId
    );

    const profiles = await UserProfile.find({
      userId: { $in: profileUserIds }
    })
      .select('userId username name avatarUrl bio website coverPhotoUrl location')
      .lean();

    const enrichedChatList = chatList.map(msg => {
      const isSender = String(msg.senderId) === String(currentUserId);

      const otherUserId = isSender ? msg.receiverId : msg.senderId;

      const otherUserProfile = profiles.find(
        p => String(p.userId) === String(otherUserId)
      );

      return {
        ...msg,
        senderProfile: isSender ? null : otherUserProfile || null,
        receiverProfile: isSender ? otherUserProfile || null : null
      };
    });

    return res.status(200).json({
      success: true,
      data: enrichedChatList
    });

  } catch (err) {
    console.error('error:', err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
