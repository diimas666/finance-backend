const admin = require('../config/firebaseAdmin.js'); // путь к твоему firebaseAdmin.js

const authMiddleware = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    console.warn('🚫 No Authorization header provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    console.warn('🚫 Bearer token is empty after trimming');
    return res.status(401).json({ message: 'Invalid token format' });
  }

  try {
    console.log('🔐 Verifying token...');
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('✅ Token verified:', decodedToken.uid);

    req.user = {
      userId: decodedToken.uid,
      email: decodedToken.email,
    };

    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    console.error('🔍 Full error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
