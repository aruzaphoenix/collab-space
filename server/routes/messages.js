const router  = require('express').Router();
const auth    = require('../middleware/auth');
const Message = require('../models/Message');

// GET last 50 messages for a board
router.get('/:boardId', auth, async (req, res) => {
  const msgs = await Message
    .find({ board: req.params.boardId })
    .sort({ createdAt: 1 })
    .limit(50)
    .populate('sender', 'name');
  res.json(msgs);
});

module.exports = router;