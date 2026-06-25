import Post from '../models/Post.js';

export const searchPost = async (req, res) => {
  try {
    const { word } = req.query;

    if (!word) {
      return res.status(400).send({
        success: false,
        message: 'No search word provided'
      });
    }

    const results = await Post.find({
      caption: { $regex: word, $options: 'i' }
    })
      .populate({
        path: 'userId',
        select: 'name userProfile',
        model: 'User',
        populate: {
          path: 'userProfile',
          model: 'UserProfile',
          select: 'avatarUrl username'
        }
      })
      .lean();

    res.status(200).send({
      success: true,
      results
    });

  } catch (err) {
    console.log(err);

    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
};