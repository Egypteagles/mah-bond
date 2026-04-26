import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  MessageCircle,
  Target,
  Camera,
  Flame,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { useFamily, ensureTodayCapsule } from "@/hooks/use-family";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatArabicDate, todayISO } from "@/lib/content";

export const Route = createFileRoute("/today")({
  head: () => ({
    meta: [
      { title: "اليوم — بيننا" },
      { name: "description", content: "كبسولة اليوم: سؤال، تحدي، ولحظة." },
    ],
  }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <TodayPage />
      </AppShell>
    </RequireFamily>
  ),
});

interface TodayState {
  capsuleId: string | null;
  question: string;
  challenge: string;
  myAnswered: boolean;
  partnerAnswered: boolean;
  myChallengeDone: boolean;
  partnerChallengeDone: boolean;
  myMomentCount: number;
  partnerMomentCount: number;
  streak: number;
  longest: number;
}

function TodayPage() {
  const { user } = useAuth();
  const { family, partnerProfile, profile } = useFamily();
  const [state, setState] = useState<TodayState | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!family || !user) return;
    // إعادة الضبط عند تبديل العائلة لمنع ظهور بيانات قديمة
    setLoading(true);
    setState(null);
    setForbidden(false);
    let cancelled = false;
    (async () => {
      try {
        const capsule = await ensureTodayCapsule(family.id);
        const [answers, challenges, moments, streakRow] = await Promise.all([
          supabase.from("answers").select("user_id").eq("capsule_id", capsule.id),
          supabase
            .from("challenge_completions")
            .select("user_id")
            .eq("capsule_id", capsule.id),
          supabase.from("moments").select("user_id").eq("capsule_id", capsule.id),
          supabase.from("streaks").select("*").eq("family_id", family.id).maybeSingle(),
        ]);
        if (cancelled) return;
        const answerUsers = new Set(answers.data?.map((a) => a.user_id) ?? []);
        const challengeUsers = new Set(challenges.data?.map((c) => c.user_id) ?? []);
        const momentByUser = new Map<string, number>();
        for (const m of moments.data ?? []) {
          momentByUser.set(m.user_id, (momentByUser.get(m.user_id) ?? 0) + 1);
        }
        setState({
          capsuleId: capsule.id,
          question: capsule.question,
          challenge: capsule.challenge,
          myAnswered: answerUsers.has(user.id),
          partnerAnswered: partnerProfile ? answerUsers.has(partnerProfile.id) : false,
          myChallengeDone: challengeUsers.has(user.id),
          partnerChallengeDone: partnerProfile
            ? challengeUsers.has(partnerProfile.id)
            : false,
          myMomentCount: momentByUser.get(user.id) ?? 0,
          partnerMomentCount: partnerProfile
            ? momentByUser.get(partnerProfile.id) ?? 0
            : 0,
          streak: streakRow.data?.current_streak ?? 0,
          longest: streakRow.data?.longest_streak ?? 0,
        });
      } catch (err) {
        if (!cancelled && err instanceof Error && err.message === "not_a_member") {
          setForbidden(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [family?.id, user?.id, partnerProfile?.id]);

  if (forbidden) {
    return <NotMemberNotice />;
  }

  if (loading || !state) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const partnerName = partnerProfile?.display_name ?? "الطرف التاني";
  const noPartner = !partnerProfile;

  return (
    <div className="space-y-5">
      {/* رأس مع التاريخ والـ streak */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{formatArabicDate(todayISO())}</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-foreground">
            كبسولة اليوم
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-warm/60 px-4 py-2">
          <Flame
            className={`h-5 w-5 text-flame ${state.streak > 0 ? "animate-pulse-flame" : ""}`}
            fill={state.streak > 0 ? "currentColor" : "none"}
          />
          <div className="leading-none">
            <div className="font-display text-lg font-black text-foreground">
              {state.streak}
            </div>
            <div className="text-[10px] text-warm-foreground/80">يوم متواصل</div>
          </div>
        </div>
      </div>

      {noPartner && (
        <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm">
          <strong>مستني انضمام {partnerName}.</strong> ابعت كود العائلة:{" "}
          <span className="rounded bg-card px-2 py-0.5 font-mono font-bold tracking-widest">
            {family?.invite_code}
          </span>
        </div>
      )}

      {/* بطاقة السؤال */}
      <Link
        to="/today/question"
        className="group block rounded-3xl bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-warm"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                سؤال اليوم
              </span>
              <ArrowLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-1" />
            </div>
            <p className="mt-2 line-clamp-2 font-display text-base font-bold leading-snug text-foreground">
              {state.question}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <StatusChip
                done={state.myAnswered}
                doneLabel="جاوبت ✓"
                pendingLabel="في انتظار إجابتك"
              />
              <StatusChip
                done={state.partnerAnswered}
                doneLabel={`${partnerName} جاوب ✓`}
                pendingLabel={`${partnerName} لسه ما جاوبش`}
              />
            </div>
          </div>
        </div>
      </Link>

      {/* بطاقة التحدي */}
      <Link
        to="/today/challenge"
        className="group block rounded-3xl bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-warm"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Target className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                تحدي مشترك
              </span>
              <ArrowLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-1" />
            </div>
            <p className="mt-2 line-clamp-2 font-display text-base font-bold leading-snug text-foreground">
              {state.challenge}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <StatusChip
                done={state.myChallengeDone}
                doneLabel="عملته ✓"
                pendingLabel="ما عملتوش لسه"
              />
              <StatusChip
                done={state.partnerChallengeDone}
                doneLabel={`${partnerName} عمله ✓`}
                pendingLabel={`${partnerName} لسه`}
              />
            </div>
          </div>
        </div>
      </Link>

      {/* بطاقة اللحظة */}
      <Link
        to="/today/moment"
        className="group block rounded-3xl bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-warm"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warm text-warm-foreground">
            <Camera className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-warm-foreground">
                لحظة من يومك
              </span>
              <ArrowLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-1" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              صورة، رسالة قصيرة، أو فكرة عابرة. شارك تفصيلة من يومك.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <StatusChip
                done={state.myMomentCount > 0}
                doneLabel={`شاركت ${state.myMomentCount}`}
                pendingLabel="ما شاركتش"
              />
              <StatusChip
                done={state.partnerMomentCount > 0}
                doneLabel={`${partnerName} شارك ${state.partnerMomentCount}`}
                pendingLabel={`${partnerName} لسه`}
              />
            </div>
          </div>
        </div>
      </Link>

      {state.longest > state.streak && state.longest > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          أطول سلسلة وصلتولها: <strong>{state.longest}</strong> يوم
        </p>
      )}

      <p className="pt-2 text-center text-xs text-muted-foreground">
        يا {profile?.display_name}، خطوة واحدة كل يوم. شوية شوية بتقربكم 💚
      </p>
    </div>
  );
}

function StatusChip({
  done,
  doneLabel,
  pendingLabel,
}: {
  done: boolean;
  doneLabel: string;
  pendingLabel: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${
        done
          ? "bg-success/15 text-success"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {done ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {done ? doneLabel : pendingLabel}
    </span>
  );
}
