const stripe = require('../config/stripeConfig');

// Admin Analytics Controller
exports.getSubscriptionAnalytics = async (req, res) => {
    try {
        // Fetch active subscriptions
        const subscriptions = await stripe.subscriptions.list({
            limit: 100,  // Adjust the limit as needed
            status: 'all',
        });

        // Calculate total subscribers and failed payments
        const totalSubscribers = subscriptions.data.length;
        const failedPayments = subscriptions.data.filter(sub => sub.status === 'unpaid').length;

        // Fetch total revenue from Stripe
        const charges = await stripe.charges.list({ limit: 100 });
        const totalRevenue = charges.data.reduce((acc, charge) => acc + charge.amount, 0) / 100;  // Convert to dollars

        res.json({ totalSubscribers, totalRevenue, failedPayments });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Error fetching analytics', details: error.message });
    }
};
