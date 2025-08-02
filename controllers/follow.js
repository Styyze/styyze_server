import UserProfile from '../models/UserProfile.js';
import User from '../models/Users.js';

export const toggleFollow = async (req, res) => {
  const { targetUserProfileId, followerUserId } = req.body;
  console.log('targetId', targetUserProfileId)

  if (!targetUserProfileId || !followerUserId) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const profile = await UserProfile.findOne({id:targetUserProfileId});
    if (!profile) {
      return res.status(404).json({ message: "Target profile not found." });
    }

    const isFollowing = profile.followers.some(
      f => f.userId.toString() === followerUserId
    );

    if (isFollowing) {
      // Unfollow logic
      await UserProfile.findOneAndUpdate({id:targetUserProfileId}, {
        $pull: { followers: { userId: followerUserId } },
        $inc: { followersCount: -1 }
      });
      return res.status(200).json({ message: "Unfollowed successfully." });
    } else {
      // Follow logic
      await UserProfile.findOneAndUpdate({id:targetUserProfileId}, {
        $addToSet: { followers: { userId: followerUserId } },
        $inc: { followersCount: 1 }
      });
      return res.status(200).json({ message: "Followed successfully." });
    }
  } catch (error) {
    console.error("Toggle follow error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};


export const getFollowersInfo = async (req, res) => {
  const { profileId } = req.params; 
  console.log(profileId);

  try {
    const userProfile = await UserProfile.findOne({id:profileId})
      .populate({
        path: 'followers.userId',
        select: 'username name userProfile',
        populate: {
          path: 'userProfile',
          select: 'avatarUrl',
        }
      });

    const followers = userProfile.followers.map(follower => ({
      userId: follower.userId._id,
      username: follower.userId.username,
      name: follower.userId.name,
      avatarUrl: follower.userId.userProfile?.avatarUrl || null
    }));

    res.status(200).json({ data: followers });
  } catch (error) {
    console.error('Error fetching follower info:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
