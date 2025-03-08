// controllers/post.js
import Follow from '../models/Follow.js';
import User from '../models/Users.js';

export const follow = async (req, res, next) => {
   const {userId, targetUserId} = req.body; 
      console.log(userId);  
      console.log(targetUserId);  

        try {
            const existingFollow = await Follow.findOne({ follower: userId, following: targetUserId });
            if (!existingFollow) {
              const newFollow = new Follow({ follower: userId, following: targetUserId });
              await newFollow.save();
              console.log("User followed successfully.");
            } else {
              console.log("User is already following the target user.");
            }
          } catch (error) {
            console.error("Error following user:", error);
          }
};

export const unfollowUser = async (userId, targetUserId) => {
    try {
      await Follow.findOneAndDelete({ follower: userId, following: targetUserId });
      console.log("User unfollowed successfully.");
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };