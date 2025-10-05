import SavePost from '../models/SavePost.js';

export const savePost = async (req, res, next) => {
  try {
    const { userId, postId, postCreatorUserId } = req.body;

    // Validate input
    if (!userId || !postId || !postCreatorUserId) {
      return res.status(400).send({
        success: false,
        message: "Input valid parameters",
      });
    }

    const existingSave = await SavePost.findOne({ userId, postId });

    if (existingSave) {
      await SavePost.deleteOne({ _id: existingSave._id });
      return res.status(200).send({
        success: true,
        data: "Post removed from your bookmark",
      });
    }

    const newSavePost = new SavePost({
      userId,
      postId,
      postCreatorUserId,
    });

    await newSavePost.save();

    return res.status(200).send({
      success: true,
       data: "Post added to your bookmark",
    });
  } catch (err) {
    console.error('Error saving/removing post:', err);
    return res.status(500).send({
      success: false,
      message: "An error occurred while processing your request.",
    });
  }
};
