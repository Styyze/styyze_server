import User from '../models/Users.js';
import UserProfile from '../models/UserProfile.js';

export const user_search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.status(400).json({ success: false, message: 'No search query provided' });
    }

    const users = await User.find({ username: { $regex: q, $options: 'i' } });

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'No users found' });
    }

    const usernames = users.map(user => user.username);

    const profiles = await UserProfile.find({ username: { $in: usernames } });

    const merged = users.map(user => {
      const profile = profiles.find(p => p.username === user.username);
      return {
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          avatarUrl: user.avatarUrl || ''
        },
      };
    });

    res.status(200).json({ success: true, data: merged });

  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};
