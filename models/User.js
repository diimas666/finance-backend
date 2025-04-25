const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, sparse: true }, // Для Firebase пользователей
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Для MongoDB авторизации
  displayName: { type: String },
  createdAt: { type: Date, default: Date.now }, // Добавляем временную метку
});

userSchema.pre('save', async function (next) {
  try {
    if (this.isModified('password') && this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    if (!this.password) {
      return false; // Пароль не задан (например, Firebase/Google)
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Error comparing password:', error);
    return false;
  }
};

module.exports = mongoose.model('User', userSchema);
