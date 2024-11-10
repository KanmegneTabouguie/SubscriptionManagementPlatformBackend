# Ktayl-Consult Subscription Management Platform
![image](https://github.com/user-attachments/assets/b3cb5f74-4177-4e4b-bfb2-e4d51bdf7386)


## Introduction

Ktayl-Consult is a comprehensive subscription management platform designed to make it easy for businesses and individuals to manage their subscriptions, payment history, and billing information. This platform integrates with **Stripe** to provide secure payment handling and offers a user-friendly interface for tracking subscriptions.

## Features

- **User Registration & Login:** Create an account or log in to manage your subscription.
- **Subscription Plans:** Choose from multiple subscription plans with different pricing tiers.
- **Promo Code Support:** Enter promotional codes for discounts when subscribing to plans.
- **Manage Subscriptions:** View and manage your active subscriptions. Options include canceling, pausing, resuming, upgrading, or downgrading your plan.
- **View Payment History:** Track and download your invoices.
- **Secure Payments with Stripe:** All payments are securely processed through Stripe.

## How to Use the Platform

- **Register:** Sign up with your email and password.
- **Log in:** Access your account to view and manage subscriptions.
- **Subscribe to Plans:** Choose the plan that fits your needs, and enter any available promo codes.
- **Manage Your Subscriptions:** View, pause, or upgrade your subscription plans in the **My Subscriptions** section.
- **View Payment History:** Track all your payments, and download invoices from the **Payment History** section.

## Demo & Step-by-Step Guide

Check out our detailed step-by-step guide on how to manage your subscriptions and payment history:

👉 [Step-by-Step Guide to Managing Your Subscription and Payment History](https://scribehow.com/shared/Managing_Your_Subscription_and_Payment_History__NDtupWUuTUumwsHWMxzx_Q)

## Technologies Used

- **Frontend:** React.js, Bootstrap for UI styling.
- **Backend:** Node.js, Express.js, Stripe API for payment processing.
- **Database:** Postgress.
- **Deployment:** Ngrok for secure tunneling during local development.

## How to Run the Project Locally

1. **Clone the repository:**
    
    ```bash
    git clone https://github.com/KanmegneTabouguie/SubscriptionManagementPlatformBackend.git    
    ```
    
2. **Install dependencies:**
    
    ```bash
    cd stripewebapp
    npm install
    
    ```
    
3. **Set up environment variables:**
Create a `.env` file and add the following:
    
    ```bash
    STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
JWT_SECRET=
DB_USER=
DB_HOST=
DB_NAME=
DB_PASSWORD=
DB_PORT=
SENDGRID_API_KEY=

    
    ```
    
4. **Start the server:**
    
    ```bash
    node index.js
    
    ```
    
5. **Open the project in your browser:**
Go to `http://localhost:3000` to view the app.

## Contributing

Contributions are welcome! If you find a bug or want to suggest an improvement, feel free to open an issue or submit a pull request.
