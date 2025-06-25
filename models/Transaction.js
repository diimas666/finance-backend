const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String, },
  date: { type: Date, default: Date.now },
  subcategory: { type: String },
});

module.exports = mongoose.model('Transaction', transactionSchema);
