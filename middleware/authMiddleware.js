const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No or invalid token provided' });
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
    };

    next();
  } catch (error) {
    console.error('❌ JWT verification failed:', error.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
