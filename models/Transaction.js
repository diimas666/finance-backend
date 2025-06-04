const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['income', 'expense'], required: true },
  date: { type: Date, default: Date.now },
  subcategories: { type: String },
});

module.exports = mongoose.model('Transaction', transactionSchema);
