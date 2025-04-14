const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');

// Создать транзакцию
router.post('/', authMiddleware, async (req, res) => {
  const { amount, category, description, type } = req.body;
  try {
    const transaction = new Transaction({
      userId: req.user.userId,
      amount,
      category,
      description,
      type,
    });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Получить транзакции
router.get('/', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.userId });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;