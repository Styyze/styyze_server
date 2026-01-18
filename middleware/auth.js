// middlewares/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/Users.js';

export const protect = async (req, res, next) => {
  const token = req.cookies?.access_token;   

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  console.log("Logged-in user token:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = {
      id: user._id,
      role: user.role
    };

    next(); 
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
