import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
});

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");

  if (!signature) {
    return new Response(JSON.stringify({ error: "No signature" }), {
      status: 400,
    });
  }

  try {
    // Get raw body as text (important for signature verification)
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      throw new Error("Webhook secret not configured");
    }

    const cryptoProvider = Stripe.createSubtleCryptoProvider();

    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    // Create admin Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id;

        if (userId && planId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          // Create subscription record
          const subscriptionData: any = {
            user_id: userId,
            plan_id: planId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items.data[0]?.price.id,
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end || false,
          };

          // Add timestamps if they exist
          if (subscription.current_period_start) {
            subscriptionData.current_period_start = new Date(
              subscription.current_period_start * 1000
            ).toISOString();
          }

          if (subscription.current_period_end) {
            subscriptionData.current_period_end = new Date(
              subscription.current_period_end * 1000
            ).toISOString();
          }

          const { error: subError } = await supabaseAdmin
            .from("subscriptions")
            .insert(subscriptionData);

          if (subError) {
            console.error("Error creating subscription:", subError);
          }

          // Update user's current plan
          const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update({
              current_plan_id: planId,
              plan_upgraded_at: new Date().toISOString(),
            })
            .eq("id", userId);

          if (profileError) {
            console.error("Error updating profile:", profileError);
          } else {
            console.log(
              `Successfully upgraded user ${userId} to plan ${planId}`
            );
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Update subscription status to canceled
        const { data: existingSub, error: findError } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (findError || !existingSub) {
          console.error("Subscription not found:", subscription.id);
          break;
        }

        // Update subscription status
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        // Remove plan from user profile
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            current_plan_id: null,
          })
          .eq("id", existingSub.user_id);

        if (error) {
          console.error("Error downgrading user:", error);
        } else {
          console.log(`Successfully downgraded user ${existingSub.user_id}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        // Update subscription details
        const updateData: any = {
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end || false,
          updated_at: new Date().toISOString(),
        };

        // Add timestamps if they exist
        if (subscription.current_period_start) {
          updateData.current_period_start = new Date(
            subscription.current_period_start * 1000
          ).toISOString();
        }

        if (subscription.current_period_end) {
          updateData.current_period_end = new Date(
            subscription.current_period_end * 1000
          ).toISOString();
        }

        if (subscription.canceled_at) {
          updateData.canceled_at = new Date(
            subscription.canceled_at * 1000
          ).toISOString();
        }

        const { data: existingSub } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (existingSub) {
          await supabaseAdmin
            .from("subscriptions")
            .update(updateData)
            .eq("stripe_subscription_id", subscription.id);

          // If subscription is no longer active, remove plan from profile
          if (
            subscription.status === "canceled" ||
            subscription.status === "unpaid"
          ) {
            await supabaseAdmin
              .from("profiles")
              .update({ current_plan_id: null })
              .eq("id", existingSub.user_id);
          }

          console.log(
            `Updated subscription ${subscription.id} - status: ${subscription.status}`
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log(`Payment failed for customer ${customerId}`);
        // You might want to send a notification to the user
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Webhook handler failed" }),
      {
        status: 400,
      }
    );
  }
});
