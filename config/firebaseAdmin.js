const admin = require('firebase-admin');

// Загружаем файл Service Account для Firebase Admin SDK
const serviceAccount = require('./personal-finance-tracker-ed196-firebase-adminsdk-fbsvc-1c786525f2.json');

// Инициализируем Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Экспортируем инициализированный admin для использования в других модулях
module.exports = admin;
