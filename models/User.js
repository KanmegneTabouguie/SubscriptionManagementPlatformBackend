const pool = require('../config/database');

exports.createUser = async (email, hashedPassword, stripeCustomerId) => {
    const result = await pool.query(
        'INSERT INTO users (email, password, stripe_customer_id) VALUES ($1, $2, $3) RETURNING id, email, stripe_customer_id',
        [email, hashedPassword, stripeCustomerId]
    );
    return result.rows[0];
};

exports.findUserByEmail = async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
};

exports.findUserById = async (id) => {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
};
