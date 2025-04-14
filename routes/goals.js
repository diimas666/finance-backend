const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const authMiddleware = require('../middleware/authMiddleware');

// Создать цель
router.post('/', authMiddleware, async (req, res) => {
  const { title, targetAmount, deadline } = req.body;
  try {
    const goal = new Goal({
      userId: req.user.userId,
      title,
      targetAmount,
      deadline,
    });
    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Получить цели
router.get('/', authMiddleware, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.userId });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
