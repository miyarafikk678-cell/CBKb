const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  passwordHash: String,
  role: { type: String, enum: ['admin','user'], default: 'user' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('User', UserSchema);