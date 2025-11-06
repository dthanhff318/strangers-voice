import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { updatePlan as updatePlanAPI } from "../lib/edgeFunctions";
import type { Plan } from "../types/membership";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface EditPlanForm {
  display_name: string;
  description: string;
  price: number;
  features: string[];
  badge_color: string;
}

export function AdminPlans() {
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<EditPlanForm>({
    display_name: "",
    description: "",
    price: 0,
    features: [],
    badge_color: "",
  });
  const [featuresText, setFeaturesText] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch all plans
  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as Plan[];
    },
  });

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      display_name: plan.display_name,
      description: plan.description || "",
      price: plan.price,
      features: plan.features,
      badge_color: plan.badge_color,
    });
    setFeaturesText(plan.features.join("\n"));
  };

  const handleSave = async () => {
    if (!editingPlan) return;

    try {
      setSaving(true);

      // Parse features from textarea (one per line)
      const features = featuresText
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      // Update plan via edge function
      const { error } = await updatePlanAPI(
        editingPlan.id,
        formData.display_name,
        formData.description,
        formData.price,
        features,
        formData.badge_color
      );

      if (error) throw error;

      toast.success("Plan updated successfully");

      // Refresh plans
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });

      // Close dialog
      setEditingPlan(null);
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error("Failed to update plan");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingPlan(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          Manage Plans
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Update pricing, benefits, and details for each membership plan
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          return (
            <div
              key={plan.id}
              className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-6"
            >
              {/* Plan Header */}
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-lg font-bold"
                  style={{ color: plan.badge_color }}
                >
                  {plan.display_name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(plan)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>

              {/* Description */}
              {plan.description && (
                <p className="text-xs text-[var(--color-text-tertiary)] mb-3">
                  {plan.description}
                </p>
              )}

              {/* Price */}
              <div className="mb-4 p-3 bg-[var(--color-bg-elevated)] rounded-lg">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Price: <span className="font-bold text-[var(--color-text-primary)]">{plan.price}$</span>
                </p>
              </div>

              {/* Features */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
                  Features ({plan.features.length})
                </p>
                {plan.features.map((feature, index) => (
                  <div
                    key={index}
                    className="text-xs text-[var(--color-text-tertiary)]"
                  >
                    • {feature}
                  </div>
                ))}
              </div>

              {/* Status */}
              <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    plan.is_active
                      ? "bg-green-500/10 text-green-500"
                      : "bg-gray-500/10 text-gray-500"
                  }`}
                >
                  {plan.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Plan Dialog */}
      <Dialog open={!!editingPlan} onOpenChange={() => handleCancel()}>
        <DialogContent className="bg-[var(--color-bg-card)] border-[var(--color-border)] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-text-primary)]">
              Edit Plan: {editingPlan?.display_name}
            </DialogTitle>
            <DialogDescription className="text-[var(--color-text-secondary)]">
              Update the plan details, pricing, and features
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-primary)]">
                Display Name
              </label>
              <Input
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
                placeholder="e.g., Silver Member"
                className="bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)]"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-primary)]">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the plan"
                rows={2}
                className="bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)]"
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-primary)]">
                Price (USD per month)
              </label>
              <Input
                type="text"
                value={formData.price}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and decimal point
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setFormData({ ...formData, price: parseFloat(value) || 0 });
                  }
                }}
                placeholder="0"
                className="bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)]"
              />
            </div>

            {/* Badge Color */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-primary)]">
                Badge Color
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={formData.badge_color}
                  onChange={(e) =>
                    setFormData({ ...formData, badge_color: e.target.value })
                  }
                  placeholder="#C0C0C0"
                  className="bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                />
                <div
                  className="w-12 h-10 rounded border border-[var(--color-border)]"
                  style={{ backgroundColor: formData.badge_color }}
                />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-primary)]">
                Features (one per line)
              </label>
              <Textarea
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                placeholder="Special Silver badge on profile&#10;Priority support&#10;Ad-free experience"
                rows={8}
                className="bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)] font-mono text-sm"
              />
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {featuresText.split("\n").filter((f) => f.trim()).length} features
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="border-[var(--color-border)] text-[var(--color-text-secondary)]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
