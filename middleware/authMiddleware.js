const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Check for 'Bearer ' in the Authorization header
    const token = authHeader.split(' ')[1]; // Split 'Bearer <token>'

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // Store the decoded user information in the request object
        next(); // Proceed to the next middleware/route
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};


exports.verifyAdminToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];  // Extract the token from the Authorization header

    if (!token) {
        return res.status(401).json({ message: 'Access denied, no token provided' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        // Ensure the user is an admin
        if (verified.isAdmin) {
            req.user = verified;  // Store the decoded token data
            next();  // Continue to the next middleware
        } else {
            return res.status(403).json({ message: 'Admin access only' });
        }
    } catch (error) {
        return res.status(400).json({ message: 'Invalid token' });
    }
};