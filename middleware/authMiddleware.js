const jwt = require('jsonwebtoken');
const User = require('../models/User.js'); // optional, agar DB se user fetch karna ho

/**
 * Middleware to protect routes
 * Expects JWT token in 'x-auth-token' header
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('x-auth-token');

        if (!token) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user ID to request object
        req.user = decoded.user;

        // Optional: Fetch user from DB if needed
        // const user = await User.findById(decoded.user.id);
        // if (!user) return res.status(404).json({ msg: 'User not found' });
        // req.user = user;

        next(); // pass control to next middleware / route handler
    } catch (err) {
        console.error('Auth Middleware Error:', err.message);
        return res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
