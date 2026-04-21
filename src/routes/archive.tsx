import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Archive as ArchiveIcon, MessageCircle, Target, Camera } from "lucide-react";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { useFamily } from "@/hooks/use-family";
import { supabase } from "@/integrations/supabase/client";
import { formatArabicDate } from "@/lib/content";

export const Route = createFileRoute("/archive")({
  head: () => ({ meta: [{ title: "الأرشيف — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <ArchivePage />
      </AppShell>
    </RequireFamily>
  ),
});

interface CapsuleSummary {
  id: string;
  capsule_date: string;
  question: string;
  challenge: string;
  answer_count: number;
  challenge_count: number;
  moment_count: number;
}

function ArchivePage() {
  const { family } = useFamily();
  const [items, setItems] = useState<CapsuleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!family) return;
    (async () => {
      const { data } = await supabase
        .from("daily_capsules")
        .select("id, capsule_date, question, challenge, answers(id), challenge_completions(id), moments(id)")
        .eq("family_id", family.id)
        .order("capsule_date", { ascending: false })
        .limit(60);
      const mapped: CapsuleSummary[] = (data ?? []).map((c: { id: string; capsule_date: string; question: string; challenge: string; answers: unknown[]; challenge_completions: unknown[]; moments: unknown[] }) => ({
        id: c.id,
        capsule_date: c.capsule_date,
        question: c.question,
        challenge: c.challenge,
        answer_count: c.answers?.length ?? 0,
        challenge_count: c.challenge_completions?.length ?? 0,
        moment_count: c.moments?.length ?? 0,
      }));
      setItems(mapped);
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
        <ArchiveIcon className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-bold text-foreground">الأرشيف</h1>
      </div>
      {items.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          لسه ما فيش كبسولات سابقة.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <Link
              key={c.id}
              to="/today"
              className="block rounded-2xl bg-card p-4 shadow-soft transition-transform hover:-translate-y-0.5"
            >
              <p className="text-xs text-muted-foreground">{formatArabicDate(c.capsule_date)}</p>
              <p className="mt-1 line-clamp-1 font-display text-base font-bold text-foreground">
                {c.question}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> {c.answer_count}/2
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" /> {c.challenge_count}/2
                </span>
                <span className="flex items-center gap-1">
                  <Camera className="h-3 w-3" /> {c.moment_count}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
