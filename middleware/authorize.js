// middlewares/authorize.js

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    console.log('req.user:', req.user); 
    console.log('req.user.role:', req.user?.role);
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        message: 'Not authorized'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    next(); 
  };
};
