import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, MessageCircle, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { useFamily, ensureTodayCapsule } from "@/hooks/use-family";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { recomputeStreak } from "@/lib/streak";

export const Route = createFileRoute("/today/question")({
  head: () => ({ meta: [{ title: "سؤال اليوم — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <QuestionPage />
      </AppShell>
    </RequireFamily>
  ),
});

interface AnswerRow {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

function QuestionPage() {
  const { user } = useAuth();
  const { family, partnerProfile, profile } = useFamily();
  const [capsule, setCapsule] = useState<{ id: string; question: string } | null>(null);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!family) return;
    const c = await ensureTodayCapsule(family.id);
    setCapsule({ id: c.id, question: c.question });
    const { data } = await supabase
      .from("answers")
      .select("*")
      .eq("capsule_id", c.id)
      .order("created_at");
    setAnswers((data ?? []) as AnswerRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family]);

  const myAnswer = answers.find((a) => a.user_id === user?.id);
  const partnerAnswer = answers.find((a) => a.user_id !== user?.id);
  const bothAnswered = answers.length >= 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !family || !capsule || !draft.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("answers").insert({
        capsule_id: capsule.id,
        user_id: user.id,
        family_id: family.id,
        content: draft.trim().slice(0, 2000),
      });
      if (error) throw error;
      toast.success("اتسجلت إجابتك ✨");
      setDraft("");
      await load();
      await recomputeStreak(family.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setSubmitting(false);
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

      <div className="rounded-3xl bg-gradient-warm p-6 shadow-soft">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <MessageCircle className="h-4 w-4" /> سؤال اليوم
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold leading-snug text-foreground md:text-3xl">
          {capsule.question}
        </h1>
      </div>

      {!myAnswer ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="اكتب إجابتك هنا..."
            rows={6}
            maxLength={2000}
            className="rounded-2xl border-2 text-base"
            required
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              💡 إجابة {partnerName} هتظهرلك بس لما تجاوب
            </span>
            <Button type="submit" disabled={submitting || !draft.trim()}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال إجابتك"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <AnswerCard
            authorName={profile?.display_name ?? "إجابتك"}
            content={myAnswer.content}
            mine
          />
          {bothAnswered && partnerAnswer ? (
            <AnswerCard
              authorName={partnerName}
              content={partnerAnswer.content}
              mine={false}
            />
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center">
              <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium text-foreground">
                إجابة {partnerName} مقفولة لحد ما يجاوب
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                عشان كل واحد يكتب رأيه بصراحة من غير ما يتأثر
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AnswerCard({
  authorName,
  content,
  mine,
}: {
  authorName: string;
  content: string;
  mine: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-soft ${
        mine ? "bg-primary/5 border-2 border-primary/20" : "bg-card"
      }`}
    >
      <div className="text-xs font-semibold text-muted-foreground">{authorName}</div>
      <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-foreground">
        {content}
      </p>
    </div>
  );
}
