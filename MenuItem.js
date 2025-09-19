const mongoose = require('mongoose');
const MenuItemSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  description: String,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('MenuItem', MenuItemSchema);