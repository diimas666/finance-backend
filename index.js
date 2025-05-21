// 📌 1. Импорты библиотек
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); // 📌 2. Загружаем переменные окружения из .env

// 📌 3. Инициализация Express-приложения
const app = express();

// 📌 4. Импорт и инициализация Firebase Admin SDK
const admin = require('./config/firebaseAdmin');
console.log('FIREBASE_ADMIN_JSON defined:', !!process.env.FIREBASE_ADMIN_JSON);

// 📌 5. Middleware: разрешаем CORS
app.use(
  cors({
    origin: [
      'http://localhost:5173', // Для разработки (Vite)
      'https://personal-finance-tracker-56qe.vercel.app', // Для продакшена (Vercel)
    ],
    credentials: true, // Разрешаем куки и заголовки авторизации
  })
);

// 📌 6. Middleware: парсинг JSON и URL-кодированных данных
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// 📌 7. Пинг-эндпоинт — проверка, что сервер жив
app.get('/api/ping', (req, res) => {
  res.send('OK');
});

// 📌 8. Импорт маршрутов
const authRoutes = require('./routes/auth'); // Аутентификация
const transactionRoutes = require('./routes/transactions'); // Транзакции
const goalRoutes = require('./routes/goals'); // Финансовые цели
const aiCategorizationRoutes = require('./routes/aiCategorization'); // AI-категоризация
const uploadReceiptRoutes = require('./routes/uploadReceipt'); // Загрузка чека
const receiptAiRoutes = require('./routes/receiptAi'); // AI-анализ чека

// 📌 9. Подключение маршрутов
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api', aiCategorizationRoutes);
app.use('/api', uploadReceiptRoutes);
app.use('/api', receiptAiRoutes);

// 📌 10. Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Server error' });
});

// 📌 11. Подключение к MongoDB
mongoose
  .connect(process.env.MONGO_URI, {}) // Строка подключения берётся из .env
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// 📌 12. Запуск сервера
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
