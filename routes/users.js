const express = require('express');
const authMiddleware = require('../middleware/authMiddleware.js'); // fixed import
const User = require('../models/User.js');

const router = express.Router();

// ---------------------------------------------
// @route   GET /api/users/me
// @desc    Get current logged-in user
// @access  Private
// ---------------------------------------------
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ---------------------------------------------
// @route   PUT /api/users/me
// @desc    Update current user profile
// @access  Private
// ---------------------------------------------
router.put('/me', authMiddleware, async (req, res) => {
    const { username, profilePic } = req.body;

    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (username) user.username = username;
        if (profilePic) user.profilePic = profilePic;

        await user.save();

        res.json({
            msg: 'Profile updated successfully',
            user: {
                id: user._id,
                username: user.username,
                profilePic: user.profilePic,
            },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ---------------------------------------------
// @route   GET /api/users/:id
// @desc    Get single user by ID
// @access  Private
// ---------------------------------------------
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ---------------------------------------------
// @route   GET /api/users
// @desc    Get all users except current logged-in user
// @access  Private
// ---------------------------------------------
router.get('/', authMiddleware, async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user.id } }).select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
