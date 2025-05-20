// 📌 1. Загружаем переменные окружения из файла .env
require('dotenv').config();

// 📌 2. Импорты библиотек
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// 📌 3. Импорт и инициализация firebase-admin
const admin = require('./config/firebaseAdmin');

// ✅ Проверка, что переменная FIREBASE_ADMIN_JSON загружена
console.log('FIREBASE_ADMIN_JSON defined:', !!process.env.FIREBASE_ADMIN_JSON);

// 📌 4. Инициализация Express-приложения
const app = express();

// 📌 5. Middleware: разрешаем CORS
app.use(
  cors({
    origin: [
      'http://localhost:5173', // Для разработки на Vite
      'https://personal-finance-tracker-56qe.vercel.app', // Для деплоя на Vercel
    ],
    credentials: true, // Разрешаем передавать куки и заголовки авторизации
  })
);

// 📌 6. Middleware: парсим JSON-тело запросов
app.use(express.json());

// 📌 7. Пинг-эндпоинт (для проверки, что сервер жив)
app.get('/api/ping', (req, res) => {
  res.send('OK');
});

// 📌 8. Импорт маршрутов (routes)
const aiCategorizationRoutes = require('./routes/aiCategorization');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const goalRoutes = require('./routes/goals');

// 📌 9. Подключение маршрутов
app.use('/api', aiCategorizationRoutes); // AI-категоризация
app.use('/api/auth', authRoutes); // Аутентификация
app.use('/api/transactions', transactionRoutes); // Транзакции
app.use('/api/goals', goalRoutes); // Финансовые цели

// 📌 10. Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Server error' });
});

// 📌 11. Подключение к базе данных MongoDB
mongoose
  .connect(process.env.MONGO_URI, {}) // URI должен быть в .env
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// 📌 12. Запуск сервера
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
