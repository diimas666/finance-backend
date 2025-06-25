const express = require('express');
const router = express.Router(); // это мини-приложение, которое обрабатывает определённые маршруты. Он нужен, чтобы разделить логику по файлам.
const auth = require('../middleware/authMiddleware');
const Reminder = require('../models/Reminder');
const { errorMonitor } = require('nodemailer/lib/xoauth2');
//.save() — метод mongoose-модели

// Получить все напоминания текущего пользователя
router.get('/', auth, async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.user._id });
    res.json(reminders);
  } catch (error) {
    console.error('Ошибка при получении напоминаний:', error.message);
    res.status(500).json({ error: 'Ошибка сервера при получении данных' });
  }
});

// Добавить новое напоминание
router.post('/', auth, async (req, res) => {
  try {
    const { date, description, amount } = req.body;
    const newReminder = new Reminder({
      userId: req.user._id,
      date,
      description,
      amount,
    });
    const saved = await newReminder.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Ошибка при сохранении напоминания:', err.message);
    res.status(400).json({ error: 'Некорректные данные' });
  }
});
// Удалить напоминание

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await Reminder.deleteOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Напоминание не найдено' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении напоминания:', error.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
module.exports = router;
