const { Schema, model, Types } = require('mongoose');
const taskSchema = new Schema({
  title:      { type: String, required: true },
  description:{ type: String },
  status:     { type: String, enum: ['todo','in-progress','done'], default: 'todo' },
  assignee:   { type: Types.ObjectId, ref: 'User' },
  board:      { type: Types.ObjectId, ref: 'Board', required: true },
}, { timestamps: true });
module.exports = model('Task', taskSchema);