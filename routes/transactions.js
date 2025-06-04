const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');
const mongoose = require('mongoose'); // 💡 Добавь это

// Создать транзакцию
router.post('/', authMiddleware, async (req, res) => {
  const { amount, category, description, subcategory, date } = req.body;
  try {
    const transaction = new Transaction({
      userId: req.user.userId,
      amount,
      category,
      description,
      subcategory, // Сохраняем subcategory
      date: date ? new Date(date) : Date.now(), // Обрабатываем дату
    });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Ошибка создания транзакции:', error); // Добавляем лог
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Получить транзакции
router.get('/', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.userId });
    res.json(transactions);
  } catch (error) {
    console.error('Ошибка получения транзакций:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Удалить транзакцию

router.delete('/:id', authMiddleware, async (req, res) => {
  console.log('➡️ Пытаемся удалить транзакцию');
  console.log('ID из params:', req.params.id);
  console.log('User из токена:', req.user);

  // Проверка ID
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Некорректный ID транзакции' });
  }

  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(req.user.userId),
    });

    if (!transaction) {
      console.log('❌ Транзакция не найдена');
      return res.status(404).json({ message: 'Транзакция не найдена' });
    }

    res.json({ message: 'Транзакция удалена' });
  } catch (error) {
    console.error('🔥 Ошибка при удалении транзакции:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
