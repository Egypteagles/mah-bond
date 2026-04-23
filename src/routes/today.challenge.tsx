import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Target, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { useFamily, ensureTodayCapsule } from "@/hooks/use-family";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { recomputeStreak } from "@/lib/streak";
import { awardXP } from "@/lib/xp";
import { notifyPartner } from "@/lib/notifications";

export const Route = createFileRoute("/today/challenge")({
  head: () => ({ meta: [{ title: "تحدي اليوم — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <ChallengePage />
      </AppShell>
    </RequireFamily>
  ),
});

function ChallengePage() {
  const { user } = useAuth();
  const { family, partnerProfile, profile } = useFamily();
  const [capsule, setCapsule] = useState<{ id: string; challenge: string } | null>(null);
  const [completions, setCompletions] = useState<{ user_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  async function load() {
    if (!family) return;
    const c = await ensureTodayCapsule(family.id);
    setCapsule({ id: c.id, challenge: c.challenge });
    const { data } = await supabase
      .from("challenge_completions")
      .select("user_id")
      .eq("capsule_id", c.id);
    setCompletions(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family]);

  const myDone = completions.some((c) => c.user_id === user?.id);
  const partnerDone = partnerProfile
    ? completions.some((c) => c.user_id === partnerProfile.id)
    : false;

  async function toggle() {
    if (!user || !family || !capsule) return;
    setBusy(true);
    try {
      if (myDone) {
        await supabase
          .from("challenge_completions")
          .delete()
          .eq("capsule_id", capsule.id)
          .eq("user_id", user.id);
      } else {
        const { error } = await supabase.from("challenge_completions").insert({
          capsule_id: capsule.id,
          user_id: user.id,
          family_id: family.id,
        });
        if (error) throw error;
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 700);
        toast.success("برافو! 🎉");
        await Promise.all([
          recomputeStreak(family.id),
          awardXP(family.id, "challenge"),
          notifyPartner({
            familyId: family.id,
            partnerId: partnerProfile?.id,
            type: "challenge",
            title: `${profile?.display_name ?? "الطرف التاني"} خلص تحدي اليوم`,
            link: "/today/challenge",
          }),
        ]);
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !capsule) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const partnerName = partnerProfile?.display_name ?? "الطرف التاني";

  return (
    <div className="space-y-5">
      <Link
        to="/today"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" /> رجوع لكبسولة اليوم
      </Link>

      <div className="rounded-3xl bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
          <Target className="h-4 w-4" /> تحدي اليوم
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold leading-snug text-foreground md:text-3xl">
          {capsule.challenge}
        </h1>

        <Button
          onClick={toggle}
          disabled={busy}
          size="lg"
          variant={myDone ? "secondary" : "default"}
          className={`mt-6 w-full text-base ${celebrate ? "animate-celebrate" : ""}`}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : myDone ? (
            <>
              <CheckCircle2 className="h-5 w-5" /> خلصته — اضغط لو عايز ترجع
            </>
          ) : (
            <>تم ✓ خلصت التحدي</>
          )}
        </Button>
      </div>

      {myDone && partnerDone && (
        <div className="rounded-2xl bg-success/10 p-5 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-success" />
          <p className="mt-2 font-display text-lg font-bold text-foreground">
            الاتنين خلصتوا! 🎉
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatBox done={myDone} label="إنت" />
        <StatBox done={partnerDone} label={partnerName} />
      </div>
    </div>
  );
}

function StatBox({ done, label }: { done: boolean; label: string }) {
  return (
    <div
      className={`rounded-2xl p-4 text-center ${
        done ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
      }`}
    >
      <CheckCircle2 className={`mx-auto h-6 w-6 ${done ? "" : "opacity-30"}`} />
      <div className="mt-1 text-xs font-semibold">{label}</div>
      <div className="text-[11px] opacity-70">{done ? "خلص ✓" : "لسه"}</div>
    </div>
  );
}
