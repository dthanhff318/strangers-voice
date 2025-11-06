# Stripe Integration Setup Guide

This guide explains how to set up Stripe payments for the VIP membership plans.

## Prerequisites

1. A Stripe account (create one at https://stripe.com)
2. Supabase CLI installed
3. Access to your Supabase project

## Step 1: Get Stripe API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Secret key** (starts with `sk_test_` for test mode)
3. Copy your **Publishable key** (starts with `pk_test_` for test mode)

## Step 2: Create Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
4. Select the following events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)

## Step 3: Set Environment Variables in Supabase

Run these commands to set your Stripe keys as Supabase secrets:

```bash
# Set Stripe Secret Key
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Set Stripe Webhook Secret
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE

# Set your site URL (for redirect after payment)
npx supabase secrets set SITE_URL=http://localhost:5173
```

For production, replace with your production Stripe keys and production URL.

## Step 4: Run Database Migration

Apply the migration to add Stripe fields to the profiles table:

```bash
npx supabase db push
```

Or if you're using migrations:

```bash
npx supabase migration up
```

## Step 5: Deploy Edge Functions

Deploy the Stripe-related edge functions:

```bash
# Deploy subscription creation function
npx supabase functions deploy subscription-plan

# Deploy webhook handler
npx supabase functions deploy stripe-webhook
```

## Step 6: Update Plan Prices

1. Go to `/admin` in your app
2. Click the "Plans" tab
3. Update the prices for each plan:
   - Silver: $2/month
   - Gold: $5/month
   - Diamond: $10/month
4. Click "Save Changes" for each plan

## How It Works

### User Flow

1. User visits `/upgrade` page
2. User clicks on a paid plan (Silver, Gold, or Diamond)
3. App calls `subscription-plan` edge function
4. Edge function creates a Stripe Checkout Session
5. User is redirected to Stripe's hosted checkout page
6. User enters payment information and completes purchase
7. Stripe sends webhook event to `stripe-webhook` function
8. Webhook handler updates user's plan in the database
9. User is redirected back to `/profile` with success

### Free Plans

If a plan has a price of $0, the app will directly update the user's plan without going through Stripe checkout.

## Testing

### Test Mode

Use Stripe's test cards to simulate payments:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

Use any future expiration date and any 3-digit CVC.

### Webhook Testing

You can test webhooks locally using Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local function
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

## Production Checklist

- [ ] Replace test API keys with production keys
- [ ] Update `SITE_URL` to production URL
- [ ] Set webhook endpoint to production URL
- [ ] Test the complete payment flow
- [ ] Monitor Stripe dashboard for successful payments

## Troubleshooting

### Webhook not receiving events

1. Check that the webhook URL is correct in Stripe dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
3. Check Supabase function logs: `npx supabase functions logs stripe-webhook`

### Payment succeeds but plan doesn't update

1. Check webhook events in Stripe dashboard
2. Check Supabase function logs for errors
3. Verify the migration was applied correctly

### Checkout session fails to create

1. Verify `STRIPE_SECRET_KEY` is set correctly
2. Check edge function logs: `npx supabase functions logs subscription-plan`
3. Ensure plan exists in database with correct pricing

## Support

For issues with:
- Stripe integration: https://stripe.com/docs
- Supabase functions: https://supabase.com/docs/guides/functions
