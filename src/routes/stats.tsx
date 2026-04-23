import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { useFamily } from "@/hooks/use-family";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/stats")({
  head: () => ({ meta: [{ title: "إحصائيات — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <StatsPage />
      </AppShell>
    </RequireFamily>
  ),
});

interface DayData {
  date: string;
  label: string;
  answers: number;
  challenges: number;
  moments: number;
}

function StatsPage() {
  const { family } = useFamily();
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!family) return;
    (async () => {
      const start = new Date();
      start.setDate(start.getDate() - 13);
      const startISO = start.toISOString().split("T")[0];
      const [a, c, m] = await Promise.all([
        supabase.from("answers").select("created_at").eq("family_id", family.id).gte("created_at", startISO),
        supabase.from("challenge_completions").select("completed_at").eq("family_id", family.id).gte("completed_at", startISO),
        supabase.from("moments").select("created_at").eq("family_id", family.id).gte("created_at", startISO),
      ]);
      const days: DayData[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().split("T")[0];
        days.push({
          date: iso,
          label: d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" }),
          answers: (a.data ?? []).filter((x) => x.created_at.startsWith(iso)).length,
          challenges: (c.data ?? []).filter((x) => x.completed_at.startsWith(iso)).length,
          moments: (m.data ?? []).filter((x) => x.created_at.startsWith(iso)).length,
        });
      }
      setData(days);
      setLoading(false);
    })();
  }, [family]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-bold text-foreground">إحصائيات الـ ١٤ يوم</h1>
      </div>

      <ChartCard title="إجابات يومية" color="oklch(0.52 0.10 145)" data={data} field="answers" />
      <ChartCard title="تحديات منجزة" color="oklch(0.72 0.16 50)" data={data} field="challenges" />
      <ChartCard title="لحظات مشاركة" color="oklch(0.70 0.20 35)" data={data} field="moments" />
    </div>
  );
}

function ChartCard({
  title, color, data, field,
}: { title: string; color: string; data: DayData[]; field: "answers" | "challenges" | "moments" }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
      <div className="mt-3 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.02 75)" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} reversed />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} orientation="right" />
            <Tooltip cursor={{ fill: "oklch(0.95 0.015 75 / 0.5)" }} />
            <Bar dataKey={field} fill={color} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}