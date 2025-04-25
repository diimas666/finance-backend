const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  savedAmount: { type: Number, default: 0 },
  currentAmount: { type: Number, default: 0 },
  deadline: { type: Date },
  image: { type: String, default: '' },
});

module.exports = mongoose.model('Goal', goalSchema);
