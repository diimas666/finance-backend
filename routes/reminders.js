const express = require('express');
const router = express.Router(); // мини-приложение для маршрутов
const auth = require('../middleware/authMiddleware');
const Reminder = require('../models/Reminder');

// Получить все напоминания текущего пользователя

const auth = require('../middleware/authMiddleware');
const Reminder = require('../models/Reminder');

// GET /api/reminders
router.get('/', auth, async (req, res) => {
  const reminders = await Reminder.find({ userId: req.user.userId });
  res.json(reminders);
});

// POST /api/reminders
router.post('/', auth, async (req, res) => {
  const { date, description, amount } = req.body;
  const newReminder = new Reminder({
    userId: req.user.userId, // использовать именно это
    date,
    description,
    amount,
  });
  const saved = await newReminder.save();
  res.status(201).json(saved);
});

// DELETE /api/reminders/:id
router.delete('/:id', auth, async (req, res) => {
  const result = await Reminder.deleteOne({
    _id: req.params.id,
    userId: req.user.userId,
  });
  if (!result.deletedCount) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;

module.exports = router;
