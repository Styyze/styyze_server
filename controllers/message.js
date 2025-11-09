import Message from '../models/Message.js';
import jwt from 'jsonwebtoken';


export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    console.log("senderId", senderId);

    const newMessage = new Message({ senderId, receiverId, content });
    await newMessage.save();

    // Emit to receiver's room
    req.io.to(receiverId.toString()).emit('new_message', {
      senderId,
      content,
      timestamp: newMessage.timestamp
    });

    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });
    console.log('Message sent successfully');
  } catch (err) {
    console.error('Message error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: err.message
    });
  }
};
