import Conversation from '../models/ConversationId.js';
import Message from '../models/Message.js';

export const getOrCreateConversation = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    // Check if conversation exists
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId], $size: 2 }
    });

    // If not, create new conversation
    if (!conversation) {
      conversation = new Conversation({ participants: [senderId, receiverId] });
      await conversation.save();
    }

    res.status(200).json({data:{
      success: true,
      conversationId: conversation._id,
      participants: conversation.participants
    }});
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, senderId, receiverId, content } = req.body;

    // Create message tied to conversation
    const newMessage = new Message({
      conversationId,
      senderId,
      receiverId,
      content
    });
    await newMessage.save();

    // Emit to receiver’s socket room
    req.io.to(receiverId.toString()).emit('new_message', {
      conversationId,
      senderId,
      content,
      timestamp: newMessage.timestamp
    });

    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
