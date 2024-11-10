const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('../models/User');
const stripe = require('../config/stripeConfig');

// Register new user
exports.register = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create Stripe customer
        const customer = await stripe.customers.create({ email });

        // Save user in the database
        const newUser = await createUser(email, hashedPassword, customer.id);

        // Create JWT token
        const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user: newUser });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// User login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Admin Login Function
exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the email and password are for the admin
        if (email === 'admin@gmail.com' && password === 'Admin123@') {
            const token = jwt.sign({ email, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: '1h' });
            return res.json({ token, isAdmin: true });
        } else {
            return res.status(403).json({ message: 'Access Denied. Admin credentials are incorrect.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during admin login' });
    }
};
