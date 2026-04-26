import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useFamily } from "@/hooks/use-family";

export const Route = createFileRoute("/family-badges")({
  head: () => ({ meta: [{ title: "شارات العائلة — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <FamilyBadgesPage />
      </AppShell>
    </RequireFamily>
  ),
});

const ALL_BADGES: Record<string, { label: string; desc: string; emoji: string }> = {
  first_week: { label: "أول أسبوع", desc: "أكملتم أول ٧ أيام مع بعض", emoji: "🎉" },
  month_streak: { label: "شهر كامل", desc: "٣٠ يوم متواصلين", emoji: "🔥" },
  hundred_moments: { label: "١٠٠ لحظة", desc: "وثّقتم ١٠٠ لحظة عائلية", emoji: "📸" },
  first_album: { label: "أول ألبوم", desc: "أنشأتم أول ألبوم صور", emoji: "🖼️" },
  first_decision: { label: "أول قرار", desc: "خدتم قرار سوا بالتصويت", emoji: "🗳️" },
  family_tree: { label: "شجرة عائلتنا", desc: "بنيتم شجرة العائلة", emoji: "🌳" },
};

function FamilyBadgesPage() {
  const { family } = useFamily();
  const [earned, setEarned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!family) return;
    supabase
      .from("family_badges")
      .select("badge_key")
      .eq("family_id", family.id)
      .then(({ data }) => {
        setEarned(new Set((data ?? []).map((r) => r.badge_key)));
        setLoading(false);
      });
  }, [family]);

  if (loading) return <div className="text-center text-muted-foreground">جاري التحميل…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/more" className="text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">شارات العائلة</h1>
          <p className="text-sm text-muted-foreground">إنجازات مشتركة بينكم.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Object.entries(ALL_BADGES).map(([key, b]) => {
          const unlocked = earned.has(key);
          return (
            <div
              key={key}
              className={`flex flex-col items-center gap-2 rounded-2xl p-4 text-center shadow-soft transition ${
                unlocked ? "bg-primary/10" : "bg-card opacity-60"
              }`}
            >
              <div className="text-4xl">{unlocked ? b.emoji : "🔒"}</div>
              <div className="text-sm font-bold text-foreground">{b.label}</div>
              <div className="text-[11px] text-muted-foreground">{b.desc}</div>
            </div>
          );
        })}
      </div>
      {earned.size === 0 && (
        <div className="rounded-2xl bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          ابدأوا تفاعلكم اليومي عشان تفتحوا شارات العائلة.
        </div>
      )}
    </div>
  );
}