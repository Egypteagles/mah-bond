import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Flame, Trophy, MessageCircle, Target, Camera, Award } from "lucide-react";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { useFamily } from "@/hooks/use-family";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/achievements")({
  head: () => ({ meta: [{ title: "الإنجازات — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <AchievementsPage />
      </AppShell>
    </RequireFamily>
  ),
});

function AchievementsPage() {
  const { family } = useFamily();
  const [stats, setStats] = useState<{
    current: number;
    longest: number;
    answers: number;
    challenges: number;
    moments: number;
  } | null>(null);

  useEffect(() => {
    if (!family) return;
    (async () => {
      const [s, a, c, m] = await Promise.all([
        supabase.from("streaks").select("*").eq("family_id", family.id).maybeSingle(),
        supabase.from("answers").select("id", { count: "exact", head: true }).eq("family_id", family.id),
        supabase.from("challenge_completions").select("id", { count: "exact", head: true }).eq("family_id", family.id),
        supabase.from("moments").select("id", { count: "exact", head: true }).eq("family_id", family.id),
      ]);
      setStats({
        current: s.data?.current_streak ?? 0,
        longest: s.data?.longest_streak ?? 0,
        answers: a.count ?? 0,
        challenges: c.count ?? 0,
        moments: m.count ?? 0,
      });
    })();
  }, [family]);

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const badges = [
    { days: 7, label: "أسبوع كامل", emoji: "🌱" },
    { days: 30, label: "شهر متواصل", emoji: "🌳" },
    { days: 100, label: "١٠٠ يوم", emoji: "🏆" },
    { days: 365, label: "سنة كاملة", emoji: "👑" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-accent" />
        <h1 className="font-display text-2xl font-bold text-foreground">الإنجازات</h1>
      </div>

      <div className="rounded-3xl bg-gradient-warm p-6 text-center shadow-soft">
        <Flame
          className={`mx-auto h-12 w-12 text-flame ${stats.current > 0 ? "animate-pulse-flame" : ""}`}
          fill={stats.current > 0 ? "currentColor" : "none"}
        />
        <div className="mt-2 font-display text-5xl font-black text-foreground">
          {stats.current}
        </div>
        <p className="text-sm text-warm-foreground">يوم متواصل</p>
        <p className="mt-2 text-xs text-muted-foreground">
          أطول سلسلة: <strong>{stats.longest}</strong> يوم
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<MessageCircle className="h-5 w-5" />} label="إجابات" value={stats.answers} />
        <StatCard icon={<Target className="h-5 w-5" />} label="تحديات" value={stats.challenges} />
        <StatCard icon={<Camera className="h-5 w-5" />} label="لحظات" value={stats.moments} />
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-foreground">الشارات</h2>
        <div className="grid grid-cols-2 gap-3">
          {badges.map((b) => {
            const earned = stats.longest >= b.days;
            return (
              <div
                key={b.days}
                className={`rounded-2xl p-4 text-center ${
                  earned ? "bg-accent/15" : "bg-muted opacity-60"
                }`}
              >
                <div className="text-3xl">{earned ? b.emoji : "🔒"}</div>
                <div className="mt-1 text-sm font-bold text-foreground">{b.label}</div>
                <div className="text-[11px] text-muted-foreground">{b.days} يوم</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-card p-4 text-center shadow-soft">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="mt-2 font-display text-2xl font-black text-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
