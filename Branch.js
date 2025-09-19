const mongoose = require('mongoose');
const BranchSchema = new mongoose.Schema({
  name: { type: String, required: true },    // e.g. "Cheesy"
  slug: { type: String, required: true, unique: true } // e.g. "cheesy"
});
module.exports = mongoose.model('Branch', BranchSchema);