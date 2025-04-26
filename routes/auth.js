const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Регистрация
router.post('/register', async (req, res) => {
  const { email, password, displayName } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      email,
      password: await bcrypt.hash(password, 10),
      displayName,
    });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({
      user: { _id: user._id, email: user.email, displayName: user.displayName },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Вход (MongoDB-авторизация)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!user.password || !isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({
      user: { _id: user._id, email: user.email, displayName: user.displayName },
      token,
    });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Обмен Firebase ID Token на кастомный JWT
router.post('/exchange-token', async (req, res) => {
  const { idToken } = req.body;
  console.log('Exchange-token request received:', {
    idToken: idToken ? 'Token present' : 'No token',
    tokenLength: idToken ? idToken.length : 0,
  });

  if (!idToken) {
    console.log('No idToken provided');
    return res.status(400).json({ message: 'No ID token provided' });
  }

  try {
    // ДОПОЛНИТЕЛЬНЫЙ ЛОГ перед проверкой токена
    console.log('ID Token который пришел на сервер:', idToken);

    // Проверяем Firebase ID Token
    console.log('Verifying Firebase ID token...');
    const decoded = await admin.auth().verifyIdToken(idToken);

    // ДОПОЛНИТЕЛЬНЫЙ ЛОГ после успешной расшифровки токена
    console.log('Токен расшифрован полностью:', decoded);

    console.log('Decoded Firebase token (короткая версия):', {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      iss: decoded.iss,
      aud: decoded.aud,
    });

    let user = await User.findOne({ firebaseUid: decoded.uid });

    if (!user) {
      console.log('Creating new user in MongoDB...');
      user = new User({
        firebaseUid: decoded.uid,
        email: decoded.email,
        displayName: decoded.name || decoded.email.split('@')[0],
      });
      await user.save();
      console.log('Created new user:', {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
      });
    }

    // Создаем кастомный JWT
    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
      },
      token: jwtToken,
    });
  } catch (error) {
    console.error('Token exchange error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    res.status(401).json({ message: 'Invalid Firebase token' });
  }
});

// Получить текущего пользователя
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
    });
  } catch (error) {
    console.error('Fetch user error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
