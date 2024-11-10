require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const stripeRoutes = require('./routes/stripeRoutes');
const userRoutes = require('./routes/userRoutes');
const { verifyToken,  verifyAdminToken} = require('./middleware/authMiddleware');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static HTML and JS

// Routes
app.use('/api/stripe', verifyToken, stripeRoutes); // Stripe routes require JWT authentication
app.use('/api/users', userRoutes); // User routes (register/login)
// Admin routes for analytics
app.use('/api/admin', verifyAdminToken, adminRoutes);
// Serve the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Serve the admin dashboard HTML file
app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin_dashboard.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
