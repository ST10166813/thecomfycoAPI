const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const router = express.Router();

// ----------------- Nodemailer transporter -----------------
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,           // e.g., smtp.gmail.com
    port: Number(process.env.SMTP_PORT),   // 587 for TLS, 465 for SSL
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS       // Gmail App Password
    }
});

// ----------------- REGISTER -----------------
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({ error: 'Please fill all fields' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: 'user'
        });

        await user.save();

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            userId: user._id,
            token,
            userDetails: { id: user._id, name: user.name, email: user.email, role: user.role }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------- LOGIN -----------------
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            userDetails: { id: user._id, name: user.name, email: user.email, role: user.role }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------- GOOGLE LOGIN -----------------
router.post('/login/google', async (req, res) => {
    try {
        const { googleIdToken } = req.body;
        if (!googleIdToken) return res.status(400).json({ error: 'Missing Google ID token' });

        const ticket = await client.verifyIdToken({
            idToken: googleIdToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        let user = await User.findOne({ email: payload.email });
        if (!user) {
            user = new User({
                name: payload.name,
                email: payload.email,
                password: null,
                role: 'user'
            });
            await user.save();
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            userDetails: { id: user._id, name: user.name, email: user.email, role: user.role }
        });

    } catch (err) {
        console.error('Google login error:', err);
        res.status(401).json({ error: 'Invalid Google token' });
    }
});

// ----------------- LOGOUT -----------------
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out (client should delete token)' });
});

// ----------------- FORGOT PASSWORD -----------------
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Email not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetCode = otp;
        user.resetCodeExpiry = Date.now() + 10 * 60 * 1000; // 10 mins
        await user.save();

        await transporter.sendMail({
            from: `"The Comfy Co" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Password Reset Code",
            text: `Your password reset code is ${otp}. It expires in 10 minutes.`,
            html: `<p>Your password reset code is <b>${otp}</b>. It expires in 10 minutes.</p>`
        });

        res.json({ message: "Reset code sent to email" });

    } catch (err) {
        console.error("Forgot password error:", err);
        res.status(500).json({ error: "Unable to send reset email. Check server logs." });
    }
});

// ----------------- RESET PASSWORD -----------------
router.post('/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Email not found" });

        if (user.resetCode !== code) return res.status(400).json({ error: "Invalid code" });
        if (Date.now() > user.resetCodeExpiry) return res.status(400).json({ error: "Code expired" });

        const hashed = await bcrypt.hash(newPassword, 10);
        user.password = hashed;
        user.resetCode = null;
        user.resetCodeExpiry = null;

        await user.save();

        res.json({ message: "Password updated successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
