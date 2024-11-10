const express = require('express');
const { register, login, adminLogin } = require('../controllers/userController');

const router = express.Router();

// User registration
router.post('/register', register);

// User login
router.post('/login', login);

// Admin login route
router.post('/admin-login', adminLogin);

module.exports = router;
