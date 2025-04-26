// Загружаем переменные окружения из .env в самом начале
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Импортируем маршруты
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const goalRoutes = require('./routes/goals');

// Импортируем инициализированный firebase-admin
const admin = require('./config/firebaseAdmin');

// Проверяем, загрузилась ли FIREBASE_ADMIN_JSON
console.log('FIREBASE_ADMIN_JSON defined:', !!process.env.FIREBASE_ADMIN_JSON);

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      'http://localhost:5173', // Локальная разработка (Vite)
      'https://personal-finance-tracker-56qe.vercel.app', // Деплой на Vercel
    ],
    credentials: true, // Для отправки cookies, если используются
  })
);
app.use(express.json()); // Парсинг JSON в теле запросов

// Пинг для мониторинга (Render, UptimeRobot)
app.get('/api/ping', (req, res) => {
  res.send('OK');
});

// Подключение маршрутов
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/goals', goalRoutes);

// Обработка ошибок (глобальный middleware)
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Server error' });
});

// Подключение к MongoDB
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Запуск сервера
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
