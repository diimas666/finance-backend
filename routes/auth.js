const express = require('express');
const jwt = require('jsonwebtoken');
const admin = require('../config/firebaseAdmin');
const User = require('../models/User');

const router = express.Router();

// Генерация JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

router.post('/google-login', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ message: 'Отсутствует idToken' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name } = decoded;

    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Попробуем найти по email, если uid не сработал (например, пользователь удалён и пересоздан)
      user = await User.findOne({ email });

      if (!user) {
        user = new User({
          firebaseUid: uid,
          email,
          displayName: name || email.split('@')[0],
        });
        await user.save();
      } else {
        // Обновим UID, если найден по email
        user.firebaseUid = uid;
        await user.save();
      }
    }

    const token = generateToken(user._id);
    res.json({
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
      },
      token,
    });
  } catch (error) {
    console.error('❌ Ошибка верификации Firebase ID токена:', error.message);
    res.status(401).json({ message: 'Недействительный idToken' });
  }
});

module.exports = router;
