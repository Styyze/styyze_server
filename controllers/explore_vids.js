import Post from '../models/Post.js';


export const getVideos = async (req, res, next) => {
  const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
  
  try {
    // Create a single regex pattern that matches any video extension
     const regexPattern = new RegExp(`[^/]+\\.(${videoExtensions.join('|')})(?:[?#]|$)`, 'i');
    const videoPosts = await Post.find({
      'media.mediaUrl': { 
        $regex: regexPattern,
        $exists: true 
      }
    })
   .populate({
  path: 'userId',
  select: 'name username',
  model: 'User',
})
.populate({
  path: 'userProfile',
  model: 'UserProfile',
  select: 'avatarUrl'
})
.lean({ virtuals: true });
    
    
    if (videoPosts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No video posts found'
      });
    }

    res.status(200).json({
      success: true,
      data: videoPosts
    });
    
  } catch (err) {
    console.error("Error fetching video posts", err);
    console.error(err.stack || err);
    res.status(500).send({
      success: false,
      message: 'There was an error processing your request',
      error: err.message,
    });
  }
}