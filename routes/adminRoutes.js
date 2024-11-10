const express = require('express');
const { verifyAdminToken } = require('../middleware/authMiddleware');
const { getSubscriptionAnalytics } = require('../controllers/adminController');

const router = express.Router();

// Route to access admin analytics dashboard
router.get('/analytics', verifyAdminToken, getSubscriptionAnalytics);

module.exports = router;
