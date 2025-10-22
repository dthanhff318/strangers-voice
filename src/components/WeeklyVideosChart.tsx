import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import type { ChartConfig } from "./ui/chart";

interface MonthlyData {
  month: string;
  records: number;
  monthStart: Date;
}

const chartConfig = {
  records: {
    label: "Records",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

export function WeeklyVideosChart() {
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthlyData();
  }, []);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);

      // Fetch all recordings with their created_at dates
      const { data: recordings, error } = await supabase
        .from("recordings")
        .select("created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Generate the last 6 months
      const monthlyMap = new Map<string, { count: number; monthStart: Date }>();
      const now = new Date();

      // Initialize all 6 months with 0 count
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthStart.setHours(0, 0, 0, 0);

        const monthKey = `${monthStart.getFullYear()}-${String(
          monthStart.getMonth() + 1
        ).padStart(2, "0")}`;

        monthlyMap.set(monthKey, { count: 0, monthStart });
      }

      // Count recordings for each month
      recordings?.forEach((recording) => {
        const date = new Date(recording.created_at);

        // Get the start of the month
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);

        // Format month key (e.g., "2024-01")
        const monthKey = `${monthStart.getFullYear()}-${String(
          monthStart.getMonth() + 1
        ).padStart(2, "0")}`;

        // Only count if the month is in our 6-month range
        if (monthlyMap.has(monthKey)) {
          const monthData = monthlyMap.get(monthKey)!;
          monthData.count++;
        }
      });

      // Convert map to array and sort by date
      const sortedData = Array.from(monthlyMap.entries())
        .map(([, data]) => ({
          month: formatMonthLabel(data.monthStart),
          records: data.count,
          monthStart: data.monthStart,
        }))
        .sort((a, b) => a.monthStart.getTime() - b.monthStart.getTime());

      setChartData(sortedData);
    } catch (error) {
      console.error("Error fetching monthly data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonthLabel = (date: Date): string => {
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear().toString().slice(-2);
    return `${month} ${year}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Records</CardTitle>
          <CardDescription>Total records created per month</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-primary)]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Records</CardTitle>
        <CardDescription>Last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="records" fill="var(--color-records)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
