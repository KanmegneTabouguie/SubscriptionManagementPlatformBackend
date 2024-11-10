const stripe = require('../config/stripeConfig');
const { findUserById } = require('../models/User'); // To retrieve user info
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Use your SendGrid API key from environment variables

// Store processed webhook events to avoid duplication
const processedEvents = new Set(); // In production, use a database to store event IDs for idempotency
// function to send emails using SendGrid
const sendEmailNotification = async (to, subject, text) => {
    const msg = {
        to, 
        from: '',  // Sender email address, configure it in SendGrid
        subject, 
        text,
    };

    try {
        await sgMail.send(msg);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};


// Create a subscription checkout session with optional trial and promo code
exports.createSubscriptionSession = async (req, res) => {
    const { priceId, trialPeriodDays = 0, promoCode = null } = req.body; // Accept trialPeriodDays and promoCode from the request
    const userId = req.user.userId; // User ID retrieved from JWT token

    try {
        // Find the user in the database
        const user = await findUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Ensure we have the customer's Stripe customer ID
        const stripeCustomerId = user.stripe_customer_id;

        // Define the session parameters
        let sessionParams = {
            payment_method_types: ['card'],
            mode: 'subscription',
            customer: stripeCustomerId,
            line_items: [{
                price: priceId, // Use the price ID for the subscription plan
                quantity: 1,
            }],
            success_url: 'https://048d-2a01-e0a-d5d-b2c0-94a9-57f9-ba34-654.ngrok-free.app/success.html',
            cancel_url: 'https://048d-2a01-e0a-d5d-b2c0-94a9-57f9-ba34-654.ngrok-free.app/cancel.html',
        };

        // Include the trial period if trialPeriodDays is greater than 0
        if (trialPeriodDays > 0) {
            sessionParams.subscription_data = {
                trial_period_days: trialPeriodDays,
            };
        }

        // Check and apply promo code if provided
        if (promoCode) {
            const promotionCode = await stripe.promotionCodes.list({
                code: promoCode,
                active: true, // Ensure the code is active
            });

            if (promotionCode.data.length === 0) {
                return res.status(400).json({ message: 'Invalid or expired promotion code.' });
            }

            // Apply the discount
            sessionParams.discounts = [{ promotion_code: promotionCode.data[0].id }];
        }

        // Create the Stripe checkout session
        const session = await stripe.checkout.sessions.create(sessionParams);
        res.json({ sessionId: session.id });
    } catch (error) {
        console.error('Error creating subscription session:', error);
        res.status(500).json({ error: 'Failed to create subscription session' });
    }
};

// Handle Stripe webhooks
exports.handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('⚠️ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Prevent processing the same event twice (idempotency)
    if (processedEvents.has(event.id)) {
        console.log(`🔄 Skipping already processed event: ${event.id}`);
        return res.json({ received: true });
    }

    // Add event to processed set (In production, store in DB)
    processedEvents.add(event.id);

    try {
        // Handle subscription-related events
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                const subscriptionId = session.subscription;
                const customerId = session.customer;

                // Find the user and send email confirmation
                const user = await findUserByIdUsingCustomerId(customerId);
                await sendEmailNotification(user.email, 'Subscription Created', `Your subscription (${subscriptionId}) has been created successfully.`);
                console.log(`✅ Subscription created: ${subscriptionId} for customer: ${customerId}`);
                break;

            case 'customer.subscription.trial_will_end':
                const trialSubscription = event.data.object;
                console.log(`⚠️ Trial ending soon for subscription ${trialSubscription.id}. Ends on ${new Date(trialSubscription.trial_end * 1000).toLocaleDateString()}.`);
                break;

            case 'customer.subscription.updated':
                const updatedSubscription = event.data.object;
                if (updatedSubscription.status === 'active' && updatedSubscription.trial_end) {
                    console.log(`📅 Trial ended for subscription ${updatedSubscription.id}. Subscription is now active.`);
                }
                break;

            case 'invoice.payment_succeeded':
                const invoice = event.data.object;
                const paidUser = await findUserByIdUsingCustomerId(invoice.customer);

                // Send email notification for payment success
                await sendEmailNotification(paidUser.email, 'Payment Success', `Your payment for subscription ${invoice.subscription} was successful.`);
                console.log(`💰 Payment succeeded for subscription ${invoice.subscription}`);
                break;

            case 'invoice.payment_failed':
                const failedInvoice = event.data.object;
                const failedUser = await findUserByIdUsingCustomerId(failedInvoice.customer);

                // Send email notification for payment failure
                await sendEmailNotification(failedUser.email, 'Payment Failed', `Your payment for subscription ${failedInvoice.subscription} has failed. Please update your payment method.`);
                console.log(`❌ Payment failed for subscription ${failedInvoice.subscription}`);
                break;

            case 'customer.subscription.deleted':
                const deletedSubscription = event.data.object;
                const deletedUser = await findUserByIdUsingCustomerId(deletedSubscription.customer);

                // Send email notification for subscription cancellation
                await sendEmailNotification(deletedUser.email, 'Subscription Canceled', `Your subscription (${deletedSubscription.id}) has been canceled.`);
                
                console.log(`❌ Subscription canceled: ${deletedSubscription.id}`);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        return res.status(500).send('Webhook processing failed.');
    }
};


// Fetch all subscriptions for the logged-in user
// Fetch all subscriptions for the logged-in user, including trial information

exports.getSubscriptions = async (req, res) => {
    const userId = req.user.userId; // Get the user ID from JWT token

    try {
        const user = await findUserById(userId); // Fetch the user from the database
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch all subscriptions for the Stripe customer
        const subscriptions = await stripe.subscriptions.list({
            customer: user.stripe_customer_id,
            status: 'all', // Fetch all subscription statuses
        });
        // Map subscription data to include relevant details and trial information
        // For each subscription, fetch the plan nickname (from the price or product)
        const subscriptionsWithTrial = await Promise.all(subscriptions.data.map(async (sub) => {
            const price = await stripe.prices.retrieve(sub.items.data[0].price.id);
            let planName = price.nickname;

            if (!planName) {
                const product = await stripe.products.retrieve(price.product);
                planName = product.name || 'Unknown Plan';
            }

            return {
                id: sub.id,
                plan: planName,
                status: sub.status,
                trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toLocaleDateString() : null,
                trial_status: sub.trial_end && sub.trial_end > Math.floor(Date.now() / 1000) ? 'in trial' : 'no trial',
            };
        }));

        res.json({ subscriptions: subscriptionsWithTrial });
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({ message: 'Server error fetching subscriptions' });
    }
};


// Cancel a subscription using Stripe's subscriptions.del method
// Cancel a subscription using Stripe's subscriptions.cancel method
exports.cancelSubscription = async (req, res) => {
    const { subscriptionId } = req.params;  // Get the subscription ID from the request params

    try {
        // Cancel the subscription in Stripe using the correct method
        const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);

        // Return success response
        res.json({
            message: 'Subscription canceled successfully',
            subscription: canceledSubscription,
        });
    } catch (error) {
        console.error('Error canceling subscription:', error);  // Log full error details
        res.status(500).json({ 
            error: 'Failed to cancel subscription', 
            details: error.message,  // Provide the detailed error message
            stack: error.stack       // Provide the stack trace for deeper debugging
        });
    }
};

// Pause a subscription
exports.pauseSubscription = async (req, res) => {
    const { subscriptionId } = req.params;

    try {
        // Pause the subscription using Stripe's API
        const pausedSubscription = await stripe.subscriptions.update(subscriptionId, {
            pause_collection: {
                behavior: 'mark_uncollectible',  // Specify how unpaid invoices are handled
            },
        });

        // Return the paused subscription data
        res.json({
            message: 'Subscription paused successfully',
            subscription: pausedSubscription,
        });
    } catch (error) {
        console.error('Error pausing subscription:', error);
        res.status(500).json({ error: 'Failed to pause subscription', details: error.message });
    }
};

// Resume a subscription
exports.resumeSubscription = async (req, res) => {
    const { subscriptionId } = req.params;

    try {
        // Resume the subscription by setting pause_collection to null
        const resumedSubscription = await stripe.subscriptions.update(subscriptionId, {
            pause_collection: null,
        });

        // Return the resumed subscription data
        res.json({
            message: 'Subscription resumed successfully',
            subscription: resumedSubscription,
        });
    } catch (error) {
        console.error('Error resuming subscription:', error);
        res.status(500).json({ error: 'Failed to resume subscription', details: error.message });
    }
};

// Fetch payment history and invoices for the logged-in user
exports.getPaymentHistory = async (req, res) => {
    const userId = req.user.userId;  // Get the user ID from the JWT token

    try {
        // Fetch the user from the database
        const user = await findUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Retrieve all invoices for the user's Stripe customer ID
        const invoices = await stripe.invoices.list({
            customer: user.stripe_customer_id,
            limit: 100,  // You can adjust the limit as needed
        });

        // Map the invoice data to include relevant details
        const invoiceData = invoices.data.map(invoice => ({
            id: invoice.id,
            amount_paid: (invoice.amount_paid / 100).toFixed(2),  // Convert to dollars
            status: invoice.status,
            invoice_date: new Date(invoice.created * 1000).toLocaleDateString(),  // Format the timestamp
            download_url: invoice.invoice_pdf,  // Link to download the invoice PDF
        }));

        res.json({ invoices: invoiceData });
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({ message: 'Error fetching payment history', details: error.message });
    }
};


// Function to change a subscription plan
exports.changeSubscriptionPlan = async (req, res) => {
    const { subscriptionId, newPriceId } = req.body;  // Get the subscription ID and new plan (price ID) from the request body

    try {
        // Update the subscription to the new plan
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            items: [{
                id: (await stripe.subscriptionItems.list({ subscription: subscriptionId })).data[0].id,
                price: newPriceId, // Update to the new price ID (plan)
            }],
            proration_behavior: 'create_prorations' // Stripe will prorate the amount based on the time remaining in the current billing cycle
        });

        res.json({
            message: 'Subscription plan updated successfully',
            subscription: updatedSubscription,
        });
    } catch (error) {
        console.error('Error updating subscription plan:', error);
        res.status(500).json({ error: 'Failed to update subscription plan', details: error.message });
    }
};