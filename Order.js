const mongoose = require('mongoose');
const ItemSub = new mongoose.Schema({
  name: String,
  qty: Number,
  price: Number
});
const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  items: [ItemSub],
  status: { type: String, enum: ['sent','received'], default: 'sent' },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Order', OrderSchema);