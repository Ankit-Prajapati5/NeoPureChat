// backend/routes/messages.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const User = require('../models/User');

// @route   GET /api/messages/:recipientId
// @desc    Get messages between current user and a specific recipient
// @access  Private
router.get('/:recipientId', auth, async (req, res) => {
    try {
        const senderId = req.user.id;
        const recipientId = req.params.recipientId;

        if (!mongoose.Types.ObjectId.isValid(recipientId)) {
            return res.status(400).json({ msg: 'Invalid recipient ID' });
        }

        const messages = await Message.find({
            $or: [
                { sender: senderId, recipient: recipientId },
                { sender: recipientId, recipient: senderId },
            ],
        })
        .sort({ timestamp: 1 })
        .populate('sender', 'username')
        .populate('recipient', 'username');

        res.json(messages);
    } catch (err) {
        console.error('GET /messages error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/messages/:messageId
// @desc    Delete a specific message
// @access  Private
router.delete('/:messageId', auth, async (req, res) => {
    try {
        const messageId = req.params.messageId;

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({ msg: 'Invalid message ID' });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        // Only sender can delete
        if (message.sender.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'You can only delete your own messages' });
        }

        await Message.findByIdAndDelete(messageId);

        res.json({ msg: 'Message deleted', messageId });
    } catch (err) {
        console.error('DELETE /messages error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/messages/clear/:recipientId
// @desc    Delete entire chat between current user and recipient
// @access  Private
router.delete('/clear/:recipientId', auth, async (req, res) => {
  try {
    const senderId = req.user.id;
    const recipientId = req.params.recipientId;

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ msg: 'Invalid recipient ID' });
    }

    // Delete all messages between sender & recipient
    const deletedMessages = await Message.find({
      $or: [
        { sender: senderId, recipient: recipientId },
        { sender: recipientId, recipient: senderId },
      ],
    });

    const deletedIds = deletedMessages.map((m) => m._id);

    await Message.deleteMany({
      _id: { $in: deletedIds },
    });

    // Notify both users via socket (if connected)
    deletedIds.forEach((msgId) => {
      req.io?.to(senderId).emit('deleteMessage', msgId);
      req.io?.to(recipientId).emit('deleteMessage', msgId);
    });

    res.json({ msg: 'Chat cleared', deletedIds });
  } catch (err) {
    console.error('CLEAR CHAT error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
