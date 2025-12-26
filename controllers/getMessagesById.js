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

export const getUserChatList = async (req, res, next) => {
  const { senderId } = req.params;
  console.log('senderId:', senderId);

  try {
    if (!senderId) {
      return res.status(400).json({
        success: false,
        message: "SenderId is Required"
      });
    }

    const chatList = await Message.find({ senderId })
      .sort({ createdAt: -1 })
      .lean();

    console.log('chatList:', chatList);

    if (chatList.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No Chat for this user"
      });
    }

    const receiverIds = chatList.map(msg => msg.receiverId);

    const receiverProfiles = await UserProfile.find({
      userId: { $in: receiverIds }
    })
      .select('userId username name avatarUrl bio website coverPhotoUrl location')
      .lean();


    const enrichedChatList = chatList.map(msg => {
      const profile = receiverProfiles.find(
        p => String(p.userId) === String(msg.receiverId)
      );
      return { ...msg, receiverProfile: profile || null };
    });


    return res.status(200).json({
      success: true,
      data: enrichedChatList
    });

  } catch (err) {
    console.log('error:', err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


