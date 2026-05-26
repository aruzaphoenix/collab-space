const Message = require('../models/Message');

// Track online users per board: { boardId: [{ userId, socketId, name }, ...] }
const onlineUsers = {};

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    // Join a board room
    socket.on('join-board', ({ boardId, userId, userName }) => {
      socket.join(boardId);
      
      // Track user in board
      if (!onlineUsers[boardId]) onlineUsers[boardId] = [];
      onlineUsers[boardId].push({ userId, socketId: socket.id, name: userName });
      
      // Broadcast updated online users to all in room
      io.to(boardId).emit('members-online', onlineUsers[boardId]);
      console.log(`User joined board: ${boardId}, Online: ${onlineUsers[boardId].length}`);
    });

    // Real-time chat message
    socket.on('send-message', async ({ boardId, text, senderId, senderName }) => {
      const msg = await Message.create({ text, sender: senderId, board: boardId });
      io.to(boardId).emit('receive-message', {
        _id: msg._id, text, createdAt: msg.createdAt,
        sender: { _id: senderId, name: senderName }
      });
    });

    // Task created → broadcast to board
    socket.on('task-created', ({ boardId, task }) => {
      socket.to(boardId).emit('task-added', task);
    });

    // Task status updated
    socket.on('task-updated', ({ boardId, task }) => {
      socket.to(boardId).emit('task-changed', task);
    });

    socket.on('disconnect', () => {
      // Remove user from all boards
      for (const boardId in onlineUsers) {
        onlineUsers[boardId] = onlineUsers[boardId].filter(u => u.socketId !== socket.id);
        if (onlineUsers[boardId].length === 0) delete onlineUsers[boardId];
        else io.to(boardId).emit('members-online', onlineUsers[boardId]);
      }
      console.log(`❌ Disconnected: ${socket.id}`);
    });
  });
};