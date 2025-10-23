import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { updateReportStatus as updateReportStatusAPI } from "../lib/edgeFunctions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Loader2, AudioLines, Users, Flag } from "lucide-react";
import { toast } from "sonner";
import { WeeklyVideosChart } from "./WeeklyVideosChart";

interface Stats {
  totalRecordings: number;
  totalUsers: number;
}

interface Report {
  id: string;
  created_at: string;
  recording_id: string;
  user_id: string;
  reasons: string[];
  additional_info: string | null;
  status: string;
  recording?: {
    title: string | null;
    file_url: string;
  };
  profile?: {
    full_name: string | null;
    email: string | null;
  };
}

const REPORT_REASON_LABELS: Record<string, string> = {
  spam: "Spam or misleading",
  inappropriate: "Inappropriate content",
  harassment: "Harassment or hate speech",
  violence: "Violence or dangerous content",
  copyright: "Copyright infringement",
  privacy: "Privacy violation",
  other: "Other",
};

export function Admin() {
  const queryClient = useQueryClient();
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);

  // Fetch stats with React Query
  const {
    data: stats,
    isLoading: loading,
    error: statsError,
  } = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // Fetch all stats in parallel
      const [recordingsRes, profilesRes] = await Promise.all([
        supabase
          .from("recordings")
          .select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      return {
        totalRecordings: recordingsRes.count ?? 0,
        totalUsers: profilesRes.count ?? 0,
      };
    },
  });

  // Fetch reports with React Query
  const {
    data: reports = [],
    isLoading: loadingReports,
    error: reportsError,
  } = useQuery<Report[]>({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      // First get all reports
      const { data: reportsData, error: reportsError } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (reportsError) {
        console.error("Supabase error fetching reports:", reportsError);
        throw reportsError;
      }

      // If we have reports, fetch related data
      if (reportsData && reportsData.length > 0) {
        // Fetch recordings
        const recordingIds = reportsData.map((r) => r.recording_id);
        const { data: recordingsData } = await supabase
          .from("recordings")
          .select("id, title, file_url")
          .in("id", recordingIds);

        // Fetch profiles
        const userIds = reportsData.map((r) => r.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        // Combine the data
        const enrichedReports = reportsData.map((report) => ({
          ...report,
          recording: recordingsData?.find((r) => r.id === report.recording_id),
          profile: profilesData?.find((p) => p.id === report.user_id),
        }));

        return enrichedReports as Report[];
      }

      return [];
    },
  });

  // Show error toast if stats or reports fail to load
  if (statsError) {
    toast.error("Failed to load statistics");
  }
  if (reportsError) {
    toast.error("Failed to load reports");
  }

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      setUpdatingReportId(reportId);

      const { error } = await updateReportStatusAPI(reportId, newStatus);

      if (error) {
        throw error;
      }

      toast.success(`Report marked as ${newStatus}`);

      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update report"
      );
    } finally {
      setUpdatingReportId(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">
          Admin Dashboard
        </h1>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-[var(--color-bg-card)] border border-[var(--color-border)]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-primary)]" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Recordings */}
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                        Total Recordings
                      </p>
                      <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                        {stats?.totalRecordings ?? 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <AudioLines className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                </div>

                {/* Total Users */}
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                        Total Users
                      </p>
                      <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                        {stats?.totalUsers ?? 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Weekly Videos Chart */}
            <WeeklyVideosChart />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            {loadingReports ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-primary)]" />
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-8 text-center">
                <Flag className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-3" />
                <p className="text-[var(--color-text-secondary)]">
                  No reports found
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              report.status === "pending"
                                ? "bg-cyan-500/10 text-cyan-500"
                                : report.status === "reviewed"
                                ? "bg-green-500/10 text-green-500"
                                : report.status === "resolved"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-gray-500/10 text-gray-500"
                            }`}
                          >
                            {report.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-[var(--color-text-tertiary)]">
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                          <span className="font-medium">Reported by:</span>{" "}
                          {report.profile?.full_name || "Unknown"} (
                          {report.profile?.email || "N/A"})
                        </p>

                        <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                          <span className="font-medium">Recording:</span>{" "}
                          {report.recording?.title || "Untitled"}
                        </p>

                        <div className="mb-2">
                          <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                            Reasons:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {report.reasons.map((reason) => (
                              <span
                                key={reason}
                                className="text-xs px-2 py-1 bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] rounded border border-[var(--color-border)]"
                              >
                                {REPORT_REASON_LABELS[reason] || reason}
                              </span>
                            ))}
                          </div>
                        </div>

                        {report.additional_info && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                              Additional Info:
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] p-3 rounded border border-[var(--color-border)]">
                              {report.additional_info}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row md:flex-col gap-2">
                        {report.status === "pending" && (
                          <Button
                            onClick={() =>
                              updateReportStatus(report.id, "reviewed")
                            }
                            variant="outline"
                            size="sm"
                            disabled={updatingReportId === report.id}
                          >
                            {updatingReportId === report.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              "Mark Reviewed"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
