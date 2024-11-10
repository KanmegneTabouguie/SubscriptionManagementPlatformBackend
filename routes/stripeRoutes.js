const express = require('express');
const { createSubscriptionSession, handleStripeWebhook, getSubscriptions, cancelSubscription, pauseSubscription, resumeSubscription,  getPaymentHistory, changeSubscriptionPlan } = require('../controllers/stripeController');

const router = express.Router();

// Route to create a subscription checkout session
router.post('/create-subscription-session', createSubscriptionSession);

// Webhook route to handle Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Route to fetch subscriptions for a user
router.get('/subscriptions', getSubscriptions);

// Route to cancel a subscription
router.post('/cancel-subscription/:subscriptionId', cancelSubscription);

// Route to pause a subscription
router.post('/pause-subscription/:subscriptionId', pauseSubscription);

// Route to resume a subscription
router.post('/resume-subscription/:subscriptionId', resumeSubscription);

// Route to fetch the user's payment history
router.get('/payment-history', getPaymentHistory);

// Route to change subscription plan (upgrade or downgrade)
router.post('/change-subscription-plan', changeSubscriptionPlan);


module.exports = router;
