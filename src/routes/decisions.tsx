import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus, Vote, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useFamily } from "@/hooks/use-family";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/decisions")({
  head: () => ({ meta: [{ title: "تصويت عائلي — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <DecisionsPage />
      </AppShell>
    </RequireFamily>
  ),
});

interface Decision {
  id: string;
  question: string;
  options: string[];
  closed: boolean;
  created_by: string;
}

interface VoteRow {
  decision_id: string;
  user_id: string;
  option_index: number;
}

function DecisionsPage() {
  const { user } = useAuth();
  const { family, members } = useFamily();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!family) return;
    const [{ data: d }, { data: v }] = await Promise.all([
      supabase.from("family_decisions").select("id, question, options, closed, created_by").eq("family_id", family.id).order("created_at", { ascending: false }),
      supabase.from("decision_votes").select("decision_id, user_id, option_index").eq("family_id", family.id),
    ]);
    setDecisions(((d ?? []) as Array<{ id: string; question: string; options: unknown; closed: boolean; created_by: string }>).map((x) => ({
      ...x,
      options: Array.isArray(x.options) ? (x.options as string[]) : [],
    })));
    setVotes((v ?? []) as VoteRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family?.id]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !family) return;
    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (cleaned.length < 2) {
      toast.error("لازم اختيارين على الأقل");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("family_decisions").insert({
        family_id: family.id,
        created_by: user.id,
        question: question.trim().slice(0, 200),
        options: cleaned,
      });
      if (error) throw error;
      setQuestion("");
      setOptions(["", ""]);
      setOpen(false);
      load();
      toast.success("اتعمل التصويت");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setBusy(false);
    }
  }

  async function vote(decisionId: string, optionIndex: number) {
    if (!user || !family) return;
    const existing = votes.find((v) => v.decision_id === decisionId && v.user_id === user.id);
    if (existing) {
      await supabase.from("decision_votes").update({ option_index: optionIndex }).eq("decision_id", decisionId).eq("user_id", user.id);
    } else {
      await supabase.from("decision_votes").insert({ decision_id: decisionId, family_id: family.id, user_id: user.id, option_index: optionIndex });
    }
    load();
  }

  async function close(id: string) {
    await supabase.from("family_decisions").update({ closed: true }).eq("id", id);
    load();
  }

  async function remove(id: string) {
    if (!confirm("تأكيد المسح؟")) return;
    await supabase.from("family_decisions").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">تصويت عائلي</h1>
          <p className="text-xs text-muted-foreground">خدوا قرارات بشكل ديمقراطي</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" /> تصويت
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تصويت جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <div>
                <Label>السؤال</Label>
                <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="نروح فين عطلة الأسبوع؟" required maxLength={200} />
              </div>
              <div>
                <Label>الاختيارات</Label>
                <div className="space-y-2">
                  {options.map((o, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={o} onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} placeholder={`اختيار ${i + 1}`} maxLength={100} />
                      {options.length > 2 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => setOptions(options.filter((_, idx) => idx !== i))}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {options.length < 6 && (
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setOptions([...options, ""])}>
                    <Plus className="h-3 w-3" /> اختيار
                  </Button>
                )}
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "إنشاء التصويت"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
      ) : decisions.length === 0 ? (
        <div className="rounded-3xl bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">
          <Vote className="mx-auto mb-2 h-12 w-12 opacity-30" />
          مفيش تصويتات لسه. ابدأ بسؤال.
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map((d) => {
            const dVotes = votes.filter((v) => v.decision_id === d.id);
            const myVote = dVotes.find((v) => v.user_id === user?.id);
            const totalMembers = members.length || 1;
            return (
              <div key={d.id} className="rounded-2xl bg-card p-4 shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="flex-1 font-bold text-foreground">{d.question}</h3>
                  {d.created_by === user?.id && (
                    <div className="flex gap-1">
                      {!d.closed && (
                        <button onClick={() => close(d.id)} className="rounded p-1 text-xs text-muted-foreground hover:text-foreground" title="إقفال">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => remove(d.id)} className="rounded p-1 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                {d.closed && <div className="mt-1 text-[11px] text-muted-foreground">مقفول</div>}
                <div className="mt-3 space-y-2">
                  {d.options.map((opt, i) => {
                    const count = dVotes.filter((v) => v.option_index === i).length;
                    const pct = Math.round((count / totalMembers) * 100);
                    const selected = myVote?.option_index === i;
                    return (
                      <button
                        key={i}
                        onClick={() => !d.closed && vote(d.id, i)}
                        disabled={d.closed}
                        className={`relative w-full overflow-hidden rounded-xl border-2 p-3 text-right transition ${
                          selected ? "border-primary" : "border-border hover:border-primary/40"
                        } ${d.closed ? "cursor-default" : ""}`}
                      >
                        <div className="absolute inset-0 bg-primary/10 transition-all" style={{ width: `${pct}%` }} />
                        <div className="relative flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground">{opt}</span>
                          <span className="text-xs text-muted-foreground">{count} صوت · {pct}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}