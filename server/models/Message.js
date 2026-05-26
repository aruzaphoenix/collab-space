const { Schema, model, Types } = require('mongoose');
const msgSchema = new Schema({
  text:   { type: String, required: true },
  sender: { type: Types.ObjectId, ref: 'User' },
  board:  { type: Types.ObjectId, ref: 'Board' },
}, { timestamps: true });
module.exports = model('Message', msgSchema);