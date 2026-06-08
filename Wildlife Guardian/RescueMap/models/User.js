const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Trong thực tế nên mã hóa bằng bcrypt
    role: { type: String, default: 'user' }
});

module.exports = mongoose.model('User', userSchema);