import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useLoginRequired } from "../App";
import { supabase } from "../lib/supabase";
import { subscriptionPlan } from "../lib/edgeFunctions";
import type { Plan } from "../types/membership";
import { ArrowLeft, Check, Crown, Loader2, Sparkles, Star } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

// Plan card icons mapping
const planIcons: Record<string, typeof Crown> = {
  silver: Star,
  gold: Crown,
  diamond: Sparkles,
};

export function Upgrade() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { onLoginRequired } = useLoginRequired();
  const queryClient = useQueryClient();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      onLoginRequired();
    }
  }, [user, onLoginRequired]);

  // Fetch all plans
  const { data: plans = [], isLoading: loadingPlans } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as Plan[];
    },
    enabled: !!user,
  });

  const handleUpgrade = async (planId: string, planName: string, planPrice: number) => {
    if (!user) {
      onLoginRequired();
      return;
    }

    try {
      setUpgrading(planId);

      // If plan is free, directly update the profile
      if (planPrice === 0) {
        const { error } = await supabase
          .from("profiles")
          .update({
            current_plan_id: planId,
            plan_upgraded_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (error) throw error;

        // Refresh profile
        await refreshProfile();

        // Invalidate all queries to refresh data everywhere
        await queryClient.invalidateQueries();

        toast.success(`Successfully upgraded to ${planName}!`, {
          description: "Enjoy your new VIP benefits",
        });
      } else {
        // For paid plans, create Stripe checkout session
        const { data, error } = await subscriptionPlan(planId);

        if (error || !data?.url) {
          throw new Error("Failed to create checkout session");
        }

        // Redirect to Stripe checkout
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Error upgrading plan:", err);
      toast.error("Failed to start checkout. Please try again.");
      setUpgrading(null);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!user) {
    return null;
  }

  if (loadingPlans) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-text-tertiary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-3">
            Upgrade to VIP
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)]">
            Choose the perfect plan for your needs
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const Icon = planIcons[plan.name] || Star;
            const isCurrentPlan = profile?.current_plan_id === plan.id;
            const isUpgrading = upgrading === plan.id;

            return (
              <div
                key={plan.id}
                className={`
                  relative bg-[var(--color-bg-card)] rounded-xl border-2 p-6
                  transition-all duration-300 hover:bg-[var(--color-bg-elevated)]
                  ${
                    isCurrentPlan
                      ? "border-[var(--color-accent-primary)] shadow-lg shadow-[var(--shadow-primary)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-border-focus)]"
                  }
                `}
              >
                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-bg-card)] border-2 border-[var(--color-accent-primary)] text-[var(--color-accent-primary)] px-4 py-1 rounded-full text-xs font-semibold">
                    Current Plan
                  </div>
                )}

                {/* Plan Icon */}
                <div className="flex justify-center mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${plan.badge_color}20` }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: plan.badge_color }}
                    />
                  </div>
                </div>

                {/* Plan Name */}
                <h3
                  className="text-xl font-bold text-center mb-2"
                  style={{ color: plan.badge_color }}
                >
                  {plan.display_name}
                </h3>

                {/* Plan Description */}
                {plan.description && (
                  <p className="text-xs text-center text-[var(--color-text-tertiary)] mb-4">
                    {plan.description}
                  </p>
                )}

                {/* Price */}
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                    ${plan.price}
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">
                    per month
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[var(--color-accent-primary)] flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Select Button */}
                <Button
                  onClick={() => handleUpgrade(plan.id, plan.display_name, plan.price)}
                  disabled={isCurrentPlan || isUpgrading}
                  className={`
                    w-full py-4 rounded-lg font-semibold text-sm transition-all
                    ${
                      isCurrentPlan
                        ? "bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] cursor-not-allowed"
                        : "bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)] shadow-lg"
                    }
                  `}
                  style={
                    !isCurrentPlan && !isUpgrading
                      ? {
                          backgroundColor: plan.badge_color,
                          color: plan.name === "diamond" ? "#000" : "#fff",
                        }
                      : undefined
                  }
                >
                  {isUpgrading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Upgrading...
                    </>
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : (
                    `Select ${plan.display_name}`
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Choose the plan that fits your needs. You can upgrade or downgrade anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
