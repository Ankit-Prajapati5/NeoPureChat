const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Load JWT secret from .env
const JWT_SECRET = process.env.JWT_SECRET;

// -----------------------------
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
// -----------------------------
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if email already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists with this email' });
        }

        // Check if username already exists
        user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ msg: 'Username already taken' });
        }

        // Create new user instance
        user = new User({ username, email, password });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Save user to database
        await user.save();

        // Create JWT token
        const payload = { user: { id: user.id } };

        jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({ token, msg: 'User registered successfully' });
        });

    } catch (err) {
        console.error('Register Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// -----------------------------
// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
// -----------------------------
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        // Create JWT token
        const payload = { user: { id: user.id } };

        jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, msg: 'Logged in successfully' });
        });

    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
