// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true, // leading/trailing whitespace remove karega
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true, // email ko lowercase mein store karega
        match: [/.+@.+\..+/, 'Please fill a valid email address'] // Email format validation
    },
    password: { // Hashed password store hoga yahan
        type: String,
        required: true,
        minlength: 6 // Minimum password length
    },
    profilePictureUrl: {
        type: String,
        default: '' // Default empty string, user can upload later
    },
    statusMessage: {
        type: String,
        default: 'Hey there! I am using NeoPureChat.'
    },
    publicKey: { // E2EE ke liye public key, baad mein add karenge
        type: String,
        default: ''
    },
    chatScore: { // AI moderation ke liye trust score
        type: Number,
        default: 100 // Default full score
    },
    contacts: [{ // Friends list ya contacts
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: { // e.g., 'pending', 'accepted', 'blocked'
            type: String,
            enum: ['pending', 'accepted', 'blocked'],
            default: 'accepted' // For initial direct add, can be 'pending' for requests
        }
    }],
    pendingContactRequests: [{ // Incoming contact requests
        fromUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true // createdAt aur updatedAt fields automatically add karega
});

module.exports = mongoose.model('User', UserSchema);