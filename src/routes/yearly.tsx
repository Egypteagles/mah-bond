import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gift, ArrowRight, Sparkles } from "lucide-react";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useFamily } from "@/hooks/use-family";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/yearly")({
  head: () => ({ meta: [{ title: "صندوق الذكريات السنوي — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <YearlyPage />
      </AppShell>
    </RequireFamily>
  ),
});

interface Highlights {
  total_moments?: number;
  total_answers?: number;
  total_challenges?: number;
  longest_streak?: number;
  top_emoji?: string;
}

function YearlyPage() {
  const { family } = useFamily();
  const year = new Date().getFullYear();
  const [highlights, setHighlights] = useState<Highlights | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function load() {
    if (!family) return;
    setLoading(true);
    const { data } = await supabase
      .from("yearly_memories")
      .select("highlights")
      .eq("family_id", family.id)
      .eq("year", year)
      .maybeSingle();
    setHighlights((data?.highlights as Highlights) ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [family]);

  async function generate() {
    if (!family) return;
    setGenerating(true);
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    const [moments, answers, challenges, streak] = await Promise.all([
      supabase.from("moments").select("id", { count: "exact", head: true }).eq("family_id", family.id).gte("created_at", start).lte("created_at", `${end}T23:59:59`),
      supabase.from("answers").select("id", { count: "exact", head: true }).eq("family_id", family.id).gte("created_at", start).lte("created_at", `${end}T23:59:59`),
      supabase.from("challenge_completions").select("id", { count: "exact", head: true }).eq("family_id", family.id).gte("completed_at", start).lte("completed_at", `${end}T23:59:59`),
      supabase.from("streaks").select("longest_streak").eq("family_id", family.id).maybeSingle(),
    ]);
    const newHighlights: Highlights = {
      total_moments: moments.count ?? 0,
      total_answers: answers.count ?? 0,
      total_challenges: challenges.count ?? 0,
      longest_streak: streak.data?.longest_streak ?? 0,
      top_emoji: "❤️",
    };
    await supabase.from("yearly_memories").upsert(
      { family_id: family.id, year, highlights: newHighlights as Record<string, unknown> },
      { onConflict: "family_id,year" },
    );
    setHighlights(newHighlights);
    setGenerating(false);
    toast.success("اتجمعت ذكريات السنة!");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/more" className="text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">صندوق ذكريات {year}</h1>
          <p className="text-sm text-muted-foreground">أهم لحظات سنتكم في مكان واحد.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground">جاري التحميل…</div>
      ) : highlights ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Stat icon="📸" label="لحظات" value={highlights.total_moments ?? 0} />
            <Stat icon="💬" label="إجابات" value={highlights.total_answers ?? 0} />
            <Stat icon="✅" label="تحديات" value={highlights.total_challenges ?? 0} />
            <Stat icon="🔥" label="أطول سلسلة" value={highlights.longest_streak ?? 0} />
          </div>
          <Button onClick={generate} disabled={generating} variant="outline" className="w-full">
            <Sparkles className="ml-2 h-4 w-4" />
            تحديث الإحصائيات
          </Button>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl bg-card p-6 text-center shadow-soft">
          <Gift className="mx-auto h-12 w-12 text-primary" />
          <p className="text-sm text-muted-foreground">لسه ما اتولّدش صندوق لسنة {year}.</p>
          <Button onClick={generate} disabled={generating}>
            {generating ? "جاري التوليد…" : "ولّد صندوق السنة"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-card p-4 shadow-soft">
      <div className="text-3xl">{icon}</div>
      <div className="font-display text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}