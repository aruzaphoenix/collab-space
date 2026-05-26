const { Schema, model, Types } = require('mongoose');
const boardSchema = new Schema({
  title:   { type: String, required: true },
  owner:   { type: Types.ObjectId, ref: 'User' },
  members: [{ type: Types.ObjectId, ref: 'User' }],
}, { timestamps: true });
module.exports = model('Board', boardSchema);