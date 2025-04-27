const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Генерация JWT токена
const generateToken = (user) => {
  return jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// Регистрация через Email/Password
router.post('/register', async (req, res) => {
  const { email, password, displayName } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email и пароль обязательны' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    user = new User({
      email,
      password: await bcrypt.hash(password, 10),
      displayName,
    });
    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
      },
      token,
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error.message);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Вход через Email/Password
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email и пароль обязательны' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Неверные учетные данные' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверные учетные данные' });
    }

    const token = generateToken(user);

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
      },
      token,
    });
  } catch (error) {
    console.error('Ошибка входа:', error.message);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обмен Firebase ID токена на свой JWT
router.post('/exchange-token', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'Нет ID токена' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);

    let user = await User.findOne({ firebaseUid: decoded.uid });

    if (!user) {
      // Пытаемся найти по email
      user = await User.findOne({ email: decoded.email });

      if (!user) {
        user = new User({
          firebaseUid: decoded.uid,
          email: decoded.email,
          displayName: decoded.name || decoded.email.split('@')[0],
        });
        await user.save();
      }
    }

    const token = generateToken(user);

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
      },
      token,
    });
  } catch (error) {
    console.error('Ошибка обмена токена:', error.message);
    res.status(401).json({ message: 'Неверный Firebase токен' });
  }
});

// Получение текущего пользователя
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
    });
  } catch (error) {
    console.error('Ошибка получения профиля:', error.message);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
