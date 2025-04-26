const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');

// Создать цель
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  const { title, targetAmount, savedAmount, deadline } = req.body;
  try {
    if (!title || !targetAmount) {
      return res
        .status(400)
        .json({ message: 'Title and targetAmount are required' });
    }

    let imageUrl = '';
    if (req.file) {
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
    }

    const goal = new Goal({
      userId: req.user.userId,
      title,
      targetAmount: Number(targetAmount),
      savedAmount: Number(savedAmount) || 0,
      deadline: deadline || null,
      image: imageUrl,
    });

    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Получить все цели
router.get('/', authMiddleware, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.userId });
    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Обновить цель
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  const { title, targetAmount, savedAmount, deadline } = req.body;
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal || goal.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    let imageUrl = goal.image;
    if (req.file) {
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

      if (goal.image) {
        const publicId = goal.image.split('/').slice(-1)[0].split('.')[0];
        await cloudinary.uploader.destroy(`goals/${publicId}`);
      }
    }

    goal.title = title || goal.title;
    goal.targetAmount = targetAmount ? Number(targetAmount) : goal.targetAmount;
    goal.savedAmount = savedAmount ? Number(savedAmount) : goal.savedAmount;
    goal.deadline = deadline || goal.deadline;
    goal.image = imageUrl;

    await goal.save();
    res.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Удалить цель
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal || goal.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (goal.image) {
      const publicId = goal.image.split('/').slice(-1)[0].split('.')[0];
      await cloudinary.uploader.destroy(`goals/${publicId}`);
    }

    await goal.deleteOne();
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
