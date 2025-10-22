import { useState } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";

interface ReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  recordingId: string;
  userId: string;
}

const REPORT_REASONS = [
  { id: "spam", label: "Spam or misleading" },
  { id: "inappropriate", label: "Inappropriate content" },
  { id: "harassment", label: "Harassment or hate speech" },
  { id: "violence", label: "Violence or dangerous content" },
  { id: "copyright", label: "Copyright infringement" },
  { id: "privacy", label: "Privacy violation" },
  { id: "other", label: "Other" },
];

export function ReportForm({
  isOpen,
  onClose,
  recordingId,
  userId,
}: ReportFormProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReasonToggle = (reasonId: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reasonId)
        ? prev.filter((id) => id !== reasonId)
        : [...prev, reasonId]
    );
  };

  const handleSubmit = async () => {
    if (selectedReasons.length === 0) {
      toast.error("Please select at least one reason");
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await supabase.from("reports").insert({
        recording_id: recordingId,
        user_id: userId,
        reasons: selectedReasons,
        additional_info: additionalInfo || null,
      });

      if (error) {
        // Check if user already reported this recording
        if (error.code === "23505") {
          toast.error("You have already reported this recording");
        } else {
          throw error;
        }
        return;
      }

      toast.success(
        "Report submitted successfully. Thank you for your feedback."
      );
      handleClose();
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReasons([]);
    setAdditionalInfo("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="bg-[var(--color-bg-card)] border-[var(--color-border)] max-w-md z-[60]"
        overlayClassName="z-[55]"
      >
        <DialogHeader>
          <DialogTitle className="text-[var(--color-text-primary)]">
            Report Recording
          </DialogTitle>
          <DialogDescription className="text-[var(--color-text-secondary)]">
            Help us understand what's wrong with this recording. Select all that
            apply.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Report Reasons */}
          <div className="space-y-3">
            {REPORT_REASONS.map((reason) => (
              <div key={reason.id} className="flex items-center space-x-3">
                <Checkbox
                  id={reason.id}
                  checked={selectedReasons.includes(reason.id)}
                  onCheckedChange={() => handleReasonToggle(reason.id)}
                />
                <label
                  htmlFor={reason.id}
                  className="text-sm text-[var(--color-text-primary)] cursor-pointer select-none"
                >
                  {reason.label}
                </label>
              </div>
            ))}
          </div>

          {/* Additional Information */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Additional information (optional):
            </p>
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Provide more details about your report..."
              className="w-full min-h-[100px] px-3 py-2 text-sm text-[var(--color-text-primary)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-transparent placeholder:text-[var(--color-text-tertiary)]"
              maxLength={500}
            />
            <p className="text-xs text-[var(--color-text-tertiary)] text-right">
              {additionalInfo.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedReasons.length === 0}
            className="bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
