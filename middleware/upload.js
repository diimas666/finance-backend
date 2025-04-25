const multer = require('multer');

// Настройка хранилища в памяти (для Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true); // Разрешаем только изображения
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // Ограничение размера файла (5 МБ)
  },
});

module.exports = upload;