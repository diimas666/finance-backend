const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const upload = require('../middleware/upload');

router.post('/upload-receipt', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Нет изображения' });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'receipts', resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    console.error('Ошибка загрузки изображения:', error);
    res.status(500).json({ error: 'Ошибка загрузки' });
  }
});

module.exports = router;
