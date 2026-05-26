const router  = require('express').Router();
const auth    = require('../middleware/auth');
const Board   = require('../models/Board');
const User    = require('../models/User');

// GET all boards for logged-in user
router.get('/', auth, async (req, res) => {
  const boards = await Board.find({ members: req.user.id }).populate('owner','name');
  res.json(boards);
});

// GET board details with members
router.get('/:id', auth, async (req, res) => {
  const board = await Board.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('members', 'name email _id');
  if (!board) return res.status(404).json({ msg: 'Board not found' });
  res.json(board);
});

// POST create board
router.post('/', auth, async (req, res) => {
  const board = await Board.create({
    title: req.body.title,
    owner: req.user.id,
    members: [req.user.id]
  });
  res.status(201).json(board);
});

// POST add member to board
router.post('/:id/invite', auth, async (req, res) => {
  const { email } = req.body;
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ msg: 'Board not found' });
    if (board.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only owner can invite members' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (board.members.includes(user._id)) {
      return res.status(400).json({ msg: 'User already in board' });
    }
    board.members.push(user._id);
    await board.save();
    const updated = await board.populate('members', 'name email _id');
    res.json({ msg: 'Member added', board: updated });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});

// DELETE board
router.delete('/:id', auth, async (req, res) => {
  await Board.findByIdAndDelete(req.params.id);
  res.json({ msg: 'Board deleted' });
});

module.exports = router;