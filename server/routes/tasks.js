const router = require('express').Router();
const auth   = require('../middleware/auth');
const Task   = require('../models/Task');

// GET tasks for a board
router.get('/:boardId', auth, async (req, res) => {
  const tasks = await Task.find({ board: req.params.boardId }).populate('assignee','name');
  res.json(tasks);
});

// POST create task
router.post('/', auth, async (req, res) => {
  const task = await Task.create(req.body);
  res.status(201).json(task);
});

// PATCH update task status
router.patch('/:id', auth, async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(task);
});

// DELETE task
router.delete('/:id', auth, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ msg: 'Task deleted' });
});

module.exports = router;