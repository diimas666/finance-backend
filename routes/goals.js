const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');

// Создать цель
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  const { title, targetAmount, savedAmount, deadline } = req.body;

  console.log('🔹 Запрос на создание цели получен');
  console.log('📦 Тело запроса:', req.body);
  console.log(
    '🖼️ Файл:',
    req.file
      ? `${req.file.originalname} (${req.file.mimetype})`
      : 'Файл не передан'
  );

  try {
    // Валидация обязательных полей
    if (!title || !targetAmount) {
      console.warn('⚠️ Не хватает обязательных полей: title или targetAmount');
      return res
        .status(400)
        .json({ message: 'Title and targetAmount are required' });
    }

    let imageUrl = '';
    if (req.file) {
      try {
        console.log('📤 Загружаем файл в Cloudinary...');
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'goals', resource_type: 'image' },
            (error, result) => {
              if (error) {
                console.error('❌ Ошибка Cloudinary:', error);
                return reject(error);
              }
              resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });

        imageUrl = result.secure_url;
        console.log('✅ Файл успешно загружен в Cloudinary:', imageUrl);
      } catch (uploadError) {
        console.error('🚨 Ошибка при загрузке изображения:', uploadError);
        return res.status(500).json({ message: 'Image upload failed' });
      }
    } else {
      console.log(
        'ℹ️ Файл не был загружен, используем пустую строку для image.'
      );
    }

    // Создаем новую цель
    const goal = new Goal({
      userId: req.user.userId,
      title,
      targetAmount: Number(targetAmount),
      savedAmount: Number(savedAmount) || 0,
      deadline: deadline || null,
      image: imageUrl, // Если файла нет, image будет пустой строкой
    });

    await goal.save();
    console.log('🎯 Цель успешно сохранена в базе данных:', goal._id);

    res.status(201).json(goal);
  } catch (error) {
    console.error('🔥 Ошибка на сервере при создании цели:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Получить все цели
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('📋 Получение целей для пользователя:', req.user.userId);
    const goals = await Goal.find({ userId: req.user.userId });
    console.log(`✅ Найдено ${goals.length} целей`);
    res.json(goals);
  } catch (error) {
    console.error('❌ Ошибка при получении целей:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Обновить цель
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  const { title, targetAmount, savedAmount, deadline } = req.body;

  try {
    console.log(`🔄 Обновление цели с ID ${req.params.id}`);
    const goal = await Goal.findById(req.params.id);

    if (!goal || goal.userId.toString() !== req.user.userId) {
      console.warn('⚠️ Цель не найдена или доступ запрещен');
      return res.status(404).json({ message: 'Goal not found' });
    }

    let imageUrl = goal.image; // Сохраняем текущую ссылку на изображение
    if (req.file) {
      console.log('📤 Загружаем новое изображение в Cloudinary...');
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'goals', resource_type: 'image' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      imageUrl = result.secure_url;
      console.log('✅ Новое изображение загружено:', imageUrl);

      // Удаляем старое изображение, если оно было
      if (goal.image && goal.image !== '') {
        const publicId = goal.image.split('/').slice(-1)[0].split('.')[0];
        console.log(`🗑️ Удаляем старое изображение с publicId: ${publicId}`);
        try {
          await cloudinary.uploader.destroy(`goals/${publicId}`);
          console.log('✅ Старое изображение удалено');
        } catch (deleteError) {
          console.error(
            '⚠️ Ошибка при удалении старого изображения:',
            deleteError
          );
        }
      }
    } else {
      console.log(
        'ℹ️ Новое изображение не загружено, оставляем текущее:',
        imageUrl
      );
    }

    // Обновляем поля цели
    goal.title = title || goal.title;
    goal.targetAmount = targetAmount ? Number(targetAmount) : goal.targetAmount;
    goal.savedAmount = savedAmount ? Number(savedAmount) : goal.savedAmount;
    goal.deadline = deadline || goal.deadline;
    goal.image = imageUrl;

    await goal.save();
    console.log('✅ Цель успешно обновлена:', goal._id);
    res.json(goal);
  } catch (error) {
    console.error('❌ Ошибка при обновлении цели:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Удалить цель
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    console.log(`🗑️ Удаление цели с ID ${req.params.id}`);
    const goal = await Goal.findById(req.params.id);

    if (!goal || goal.userId.toString() !== req.user.userId) {
      console.warn('⚠️ Цель не найдена или доступ запрещен');
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Удаляем изображение из Cloudinary, если оно существует
    if (goal.image && goal.image !== '') {
      const publicId = goal.image.split('/').slice(-1)[0].split('.')[0];
      console.log(`🗑️ Удаляем изображение с publicId: ${publicId}`);
      try {
        await cloudinary.uploader.destroy(`goals/${publicId}`);
        console.log('✅ Изображение удалено из Cloudinary');
      } catch (deleteError) {
        console.error('⚠️ Ошибка при удалении изображения:', deleteError);
      }
    } else {
      console.log('ℹ️ У цели нет изображения для удаления');
    }

    await goal.deleteOne();
    console.log('✅ Цель успешно удалена из базы данных');
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    console.error('❌ Ошибка при удалении цели:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
