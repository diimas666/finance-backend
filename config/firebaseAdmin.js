const admin = require('firebase-admin');

// Проверяем наличие FIREBASE_ADMIN_JSON
if (!process.env.FIREBASE_ADMIN_JSON) {
  console.error('Error: FIREBASE_ADMIN_JSON is not defined in .env');
  throw new Error('FIREBASE_ADMIN_JSON is required');
}

// Загружаем Service Account
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_JSON);
  console.log('Firebase Admin project_id:', serviceAccount.project_id); // Логируем project_id
} catch (error) {
  console.error('Error parsing FIREBASE_ADMIN_JSON:', error.message);
  throw new Error('Invalid FIREBASE_ADMIN_JSON format');
}

// Проверяем наличие private_key
if (!serviceAccount.private_key) {
  console.error('Error: private_key is missing in FIREBASE_ADMIN_JSON');
  throw new Error('Invalid FIREBASE_ADMIN_JSON');
}

// Инициализируем Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error(
    'Firebase Admin initialization error:',
    error.message,
    error.stack
  );
  throw error;
}

// Экспортируем admin
module.exports = admin;
