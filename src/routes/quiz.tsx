import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Brain, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useFamily } from "@/hooks/use-family";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { calcCompatibility, currentMonthKey, pickMonthlyQuestions, type QuizQuestion } from "@/lib/quiz";
import { notifyPartner } from "@/lib/notifications";
import { awardXP } from "@/lib/xp";

export const Route = createFileRoute("/quiz")({
  head: () => ({ meta: [{ title: "استبيان التوافق — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <QuizPage />
      </AppShell>
    </RequireFamily>
  ),
});

function QuizPage() {
  const { user } = useAuth();
  const { family, partnerProfile, profile } = useFamily();
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [myAnswers, setMyAnswers] = useState<number[]>([]);
  const [partnerAnswers, setPartnerAnswers] = useState<number[] | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!family) return;
    const monthKey = currentMonthKey();
    let { data: quiz } = await supabase
      .from("compatibility_quizzes")
      .select("*")
      .eq("family_id", family.id)
      .eq("month_key", monthKey)
      .maybeSingle();
    if (!quiz) {
      const qs = pickMonthlyQuestions(`${family.id}-${monthKey}`, 5);
      const { data: created } = await supabase
        .from("compatibility_quizzes")
        .insert([{ family_id: family.id, month_key: monthKey, questions: qs as unknown as never }])
        .select()
        .single();
      quiz = created;
    }
    if (!quiz) return;
    setQuizId(quiz.id);
    const qs = quiz.questions as unknown as QuizQuestion[];
    setQuestions(qs);
    const { data: ans } = await supabase
      .from("compatibility_answers")
      .select("user_id, answers")
      .eq("quiz_id", quiz.id);
    const mine = ans?.find((a) => a.user_id === user?.id);
    const partner = ans?.find((a) => a.user_id !== user?.id);
    if (mine) {
      setMyAnswers(mine.answers as number[]);
      setSubmitted(true);
    } else {
      setMyAnswers(new Array(qs.length).fill(-1));
    }
    if (partner) setPartnerAnswers(partner.answers as number[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family, user]);

  async function submit() {
    if (!user || !family || !quizId) return;
    if (myAnswers.some((a) => a < 0)) {
      toast.error("جاوب على كل الأسئلة");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("compatibility_answers").insert({
        quiz_id: quizId,
        family_id: family.id,
        user_id: user.id,
        answers: myAnswers,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("اتسجلت إجاباتك ✨");
      if (partnerProfile) {
        await notifyPartner({
          familyId: family.id,
          partnerId: partnerProfile.id,
          type: "quiz",
          title: `${profile?.display_name} كمل استبيان التوافق`,
          body: "ادخل واعمله انت كمان عشان تشوف نسبة التوافق",
          link: "/quiz",
        });
      }
      await awardXP(family.id, "quiz_complete");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const bothDone = submitted && partnerAnswers !== null;
  const compatibility = bothDone ? calcCompatibility(myAnswers, partnerAnswers!) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-bold text-foreground">استبيان التوافق الشهري</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        ٥ أسئلة بسيطة كل شهر، تجاوبوا عليها كل واحد لوحده، ونشوف بقى نسبة التوافق بينكم 💚
      </p>

      {bothDone && compatibility !== null && (
        <div className="rounded-3xl bg-gradient-warm p-6 text-center shadow-warm">
          <Sparkles className="mx-auto h-10 w-10 text-accent" />
          <div className="mt-2 font-display text-6xl font-black text-foreground" dir="ltr">
            {compatibility}%
          </div>
          <p className="mt-2 text-sm font-medium text-foreground">
            {compatibility >= 80
              ? "توافق رهيب! بتفهموا بعض جداً"
              : compatibility >= 50
                ? "توافق كويس، فيه مساحة لمعرفة أكتر"
                : "اكتشفوا اختلافاتكم… ده بيخلي العلاقة أحلى"}
          </p>
        </div>
      )}

      {!submitted ? (
        <div className="space-y-4">
          {questions.map((q, qi) => (
            <div key={qi} className="rounded-2xl bg-card p-4 shadow-soft">
              <h3 className="font-display text-base font-bold text-foreground">
                {qi + 1}. {q.q}
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {q.options.map((opt, oi) => {
                  const selected = myAnswers[qi] === oi;
                  return (
                    <button
                      key={oi}
                      onClick={() =>
                        setMyAnswers((arr) => arr.map((v, i) => (i === qi ? oi : v)))
                      }
                      className={`rounded-xl border-2 p-3 text-right text-sm transition-all ${
                        selected
                          ? "border-primary bg-primary/10 font-bold text-primary"
                          : "border-border bg-card text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <Button onClick={submit} disabled={busy} className="w-full" size="lg">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "أرسل إجاباتك"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, qi) => {
            const myChoice = myAnswers[qi];
            const partnerChoice = partnerAnswers?.[qi];
            const match = partnerChoice !== undefined && partnerChoice === myChoice;
            return (
              <div key={qi} className="rounded-2xl bg-card p-4 shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-sm font-bold text-foreground">
                    {qi + 1}. {q.q}
                  </h3>
                  {bothDone && match && <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />}
                </div>
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <span className="font-bold text-primary">إنت: </span>
                    {q.options[myChoice]}
                  </div>
                  {bothDone ? (
                    <div className={`rounded-lg p-2 ${match ? "bg-success/10" : "bg-muted/40"}`}>
                      <span className="font-bold text-foreground">
                        {partnerProfile?.display_name ?? "الطرف التاني"}:{" "}
                      </span>
                      {q.options[partnerChoice!]}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-muted/40 p-2 text-muted-foreground">
                      مستنين {partnerProfile?.display_name ?? "الطرف التاني"} يخلص…
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}