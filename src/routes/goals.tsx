import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Star, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFamily } from "@/hooks/use-family";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { notifyPartner } from "@/lib/notifications";
import { awardXP } from "@/lib/xp";

export const Route = createFileRoute("/goals")({
  head: () => ({ meta: [{ title: "الأهداف الأسبوعية — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <GoalsPage />
      </AppShell>
    </RequireFamily>
  ),
});

interface Goal {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  target_count: number;
  week_start: string;
  completed_by_creator: boolean;
  completed_by_partner: boolean;
  progress_creator: number;
  progress_partner: number;
}

function weekStartISO(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = day; // ابدأ من الأحد
  d.setDate(d.getDate() - diff);
  return d.toISOString().split("T")[0];
}

function GoalsPage() {
  const { user } = useAuth();
  const { family, partnerProfile, profile } = useFamily();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [target, setTarget] = useState(7);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!family) return;
    const { data } = await supabase
      .from("weekly_goals")
      .select("*")
      .eq("family_id", family.id)
      .order("week_start", { ascending: false })
      .limit(20);
    setGoals((data ?? []) as Goal[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !family || !title.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("weekly_goals").insert({
        family_id: family.id,
        created_by: user.id,
        title: title.trim().slice(0, 120),
        description: desc.trim().slice(0, 500) || null,
        target_count: target,
        week_start: weekStartISO(),
      });
      if (error) throw error;
      if (partnerProfile) {
        await notifyPartner({
          familyId: family.id,
          partnerId: partnerProfile.id,
          type: "goal",
          title: `${profile?.display_name} اقترح هدف أسبوعي جديد`,
          body: title,
          link: "/goals",
        });
      }
      toast.success("اتسجل الهدف ✨");
      setTitle("");
      setDesc("");
      setTarget(7);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setBusy(false);
    }
  }

  async function bumpProgress(g: Goal, delta: number) {
    if (!user || !family) return;
    const isCreator = g.created_by === user.id;
    const field = isCreator ? "progress_creator" : "progress_partner";
    const completedField = isCreator ? "completed_by_creator" : "completed_by_partner";
    const newProgress = Math.max(0, Math.min(g.target_count, (isCreator ? g.progress_creator : g.progress_partner) + delta));
    const completed = newProgress >= g.target_count;
    await supabase
      .from("weekly_goals")
      .update({ [field]: newProgress, [completedField]: completed })
      .eq("id", g.id);
    if (completed && !((isCreator && g.completed_by_creator) || (!isCreator && g.completed_by_partner))) {
      await awardXP(family.id, "goal_complete");
      toast.success("مبروك! خلصت الهدف 🎉");
    }
    load();
  }

  async function remove(id: string) {
    if (!confirm("متأكد؟")) return;
    await supabase.from("weekly_goals").delete().eq("id", id);
    load();
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-accent" />
          <h1 className="font-display text-2xl font-bold text-foreground">أهداف أسبوعية</h1>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> هدف جديد
        </Button>
      </div>

      {showForm && (
        <form onSubmit={create} className="space-y-3 rounded-3xl bg-card p-5 shadow-soft">
          <div>
            <Label htmlFor="title">عنوان الهدف</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: نقرأ ٣٠ دقيقة كل يوم"
              maxLength={120}
              required
            />
          </div>
          <div>
            <Label htmlFor="desc">تفاصيل (اختياري)</Label>
            <Textarea
              id="desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={500}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="target">عدد المرات في الأسبوع</Label>
            <Input
              id="target"
              type="number"
              min={1}
              max={30}
              value={target}
              onChange={(e) => setTarget(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
              dir="ltr"
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "أضف الهدف"}
          </Button>
        </form>
      )}

      {goals.length === 0 && !showForm && (
        <div className="rounded-3xl bg-card p-10 text-center shadow-soft">
          <Star className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            ضيفوا أول هدف أسبوعي مشترك بينكم.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {goals.map((g) => {
          const isCreator = g.created_by === user?.id;
          const myProgress = isCreator ? g.progress_creator : g.progress_partner;
          const partnerProgress = isCreator ? g.progress_partner : g.progress_creator;
          const myDone = isCreator ? g.completed_by_creator : g.completed_by_partner;
          const partnerDone = isCreator ? g.completed_by_partner : g.completed_by_creator;
          const partnerName = partnerProfile?.display_name ?? "الطرف التاني";
          return (
            <div key={g.id} className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">{g.title}</h3>
                  {g.description && <p className="mt-1 text-xs text-muted-foreground">{g.description}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    أسبوع: {new Date(g.week_start).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
                  </p>
                </div>
                {isCreator && (
                  <button onClick={() => remove(g.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <ProgressBlock
                  label="إنت"
                  progress={myProgress}
                  target={g.target_count}
                  done={myDone}
                  onPlus={() => bumpProgress(g, 1)}
                  onMinus={() => bumpProgress(g, -1)}
                  interactive
                />
                <ProgressBlock
                  label={partnerName}
                  progress={partnerProgress}
                  target={g.target_count}
                  done={partnerDone}
                  interactive={false}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProgressBlock({
  label,
  progress,
  target,
  done,
  onPlus,
  onMinus,
  interactive,
}: {
  label: string;
  progress: number;
  target: number;
  done: boolean;
  onPlus?: () => void;
  onMinus?: () => void;
  interactive: boolean;
}) {
  const percent = Math.round((progress / target) * 100);
  return (
    <div className={`rounded-xl p-3 ${done ? "bg-success/10" : "bg-muted/40"}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground">{label}</span>
        {done && <CheckCircle2 className="h-4 w-4 text-success" />}
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-card">
        <div
          className={`h-full transition-all ${done ? "bg-success" : "bg-primary"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground" dir="ltr">
          {progress}/{target}
        </span>
        {interactive && (
          <div className="flex items-center gap-1">
            <button
              onClick={onMinus}
              className="h-6 w-6 rounded-md bg-card text-sm font-bold text-foreground hover:bg-muted"
            >
              −
            </button>
            <button
              onClick={onPlus}
              className="h-6 w-6 rounded-md bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}