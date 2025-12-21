import Message from '../models/Message.js';
export const getUserMessagesById = async (req, res, next) => {
  const { conversationId} = req.params;
  console.log('cons Id:', conversationId)
  try {
    if (!conversationId)
    {
       return  res.status(400).json({success: false, message: "ConversationId is Required"})
    }
    const messages = await Message.find({conversationId:conversationId})
    .sort({timestamps: -1 });
console.log("collection name:", Message.collection.name);
    if (messages.length === 0){
        return res.status(404).json({success: false, message: "No message for this user"});
    }
    return res.status(200).json({success: true, data:messages});
  }catch(err){
console.log(' error:', err);
return res.status(500).json({
    success:false,
    message: "Server Error"
})
  }
}