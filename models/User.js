const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  uid: { type: String, unique: true }, // Firebase UID
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Убрали required
  displayName: { type: String },
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // Если пароль не задан (Google/фейковый логин)
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
