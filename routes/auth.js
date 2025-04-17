const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Регистрация
router.post('/register', async (req, res) => {
  const { uid, email, displayName, password } = req.body;
  try {
    let user = await User.findOne({ $or: [{ uid }, { email }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({ uid, email, displayName, password });
    await user.save();

    const token = jwt.sign({ userId: user._id, uid }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    res.status(201).json({ token, userId: user._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Вход
router.post('/login', async (req, res) => {
  const { uid, email, displayName, password } = req.body;
  try {
    let user = await User.findOne({ $or: [{ uid }, { email }] });

    if (!user) {
      // Создаём нового пользователя для Google/фейкового логина
      user = new User({ uid, email, displayName });
      await user.save();
    } else if (password) {
      // Проверяем пароль, если передан
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
    }

    const token = jwt.sign({ userId: user._id, uid }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    res.json({
      token,
      userId: user._id,
      user: { email: user.email, displayName: user.displayName },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Сброс пароля (запрос)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset',
      text: `Click this link to reset your password: ${process.env.FRONTEND_URL}/reset-password/${token}`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Сброс пароля (обновление)
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.password = password;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

module.exports = router;
