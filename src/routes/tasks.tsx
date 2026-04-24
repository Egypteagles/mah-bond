import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus, ListChecks, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useFamily } from "@/hooks/use-family";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "مهام منزلية — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <TasksPage />
      </AppShell>
    </RequireFamily>
  ),
});

interface Task {
  id: string;
  title: string;
  assigned_to: string | null;
  due_date: string | null;
  done: boolean;
  priority: string;
  created_by: string;
}

function TasksPage() {
  const { user } = useAuth();
  const { family, members } = useFamily();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", assigned_to: "", due_date: "", priority: "normal" });
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | "mine" | "done">("all");

  async function load() {
    if (!family) return;
    const { data } = await supabase.from("household_tasks").select("id, title, assigned_to, due_date, done, priority, created_by").eq("family_id", family.id).order("done").order("due_date", { ascending: true, nullsFirst: false });
    setTasks((data ?? []) as Task[]);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [family?.id]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !family) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("household_tasks").insert({
        family_id: family.id, created_by: user.id,
        title: form.title.trim().slice(0, 200),
        assigned_to: form.assigned_to || null,
        due_date: form.due_date || null,
        priority: form.priority,
      });
      if (error) throw error;
      setForm({ title: "", assigned_to: "", due_date: "", priority: "normal" });
      setOpen(false);
      load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "حصل خطأ"); }
    finally { setBusy(false); }
  }

  async function toggle(t: Task) {
    if (!user) return;
    await supabase.from("household_tasks").update({ done: !t.done, done_at: !t.done ? new Date().toISOString() : null, done_by: !t.done ? user.id : null }).eq("id", t.id);
    load();
  }

  async function remove(id: string) {
    if (!confirm("تأكيد المسح؟")) return;
    await supabase.from("household_tasks").delete().eq("id", id);
    load();
  }

  const filtered = tasks.filter((t) => {
    if (filter === "mine") return t.assigned_to === user?.id && !t.done;
    if (filter === "done") return t.done;
    return !t.done;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">المهام المنزلية</h1>
          <p className="text-xs text-muted-foreground">قسموا الشغل بينكم</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" /> مهمة</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>مهمة جديدة</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <div><Label>المهمة</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={200} placeholder="غسيل الأطباق" /></div>
              <div>
                <Label>مسئول مين؟</Label>
                <select className="mt-1 w-full rounded-xl border-2 border-input bg-background px-3 py-2 text-sm" value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>
                  <option value="">— أي حد —</option>
                  {members.map((m) => (<option key={m.id} value={m.id}>{m.display_name}</option>))}
                </select>
              </div>
              <div><Label>موعد (اختياري)</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} dir="ltr" /></div>
              <div>
                <Label>الأولوية</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[["low", "عادي"], ["normal", "متوسط"], ["high", "عاجل"]].map(([k, l]) => (
                    <button key={k} type="button" onClick={() => setForm({ ...form, priority: k })} className={`rounded-xl border-2 p-2 text-xs ${form.priority === k ? "border-primary bg-primary/10" : "border-border"}`}>{l}</button>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={busy} className="w-full">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "إضافة"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        {[["all", "كله"], ["mine", "ليّ"], ["done", "اتعمل"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k as "all" | "mine" | "done")} className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{l}</button>
        ))}
      </div>

      {loading ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /> : filtered.length === 0 ? (
        <div className="rounded-3xl bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">
          <ListChecks className="mx-auto mb-2 h-12 w-12 opacity-30" /> مفيش مهام دلوقتي.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const assignee = members.find((m) => m.id === t.assigned_to);
            const overdue = t.due_date && !t.done && new Date(t.due_date) < new Date();
            return (
              <div key={t.id} className="group flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
                <button onClick={() => toggle(t)} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 ${t.done ? "border-success bg-success text-success-foreground" : "border-border hover:border-primary"}`}>
                  {t.done && <Check className="h-4 w-4" />}
                </button>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${t.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{t.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {assignee?.display_name ?? "أي حد"}
                    {t.due_date && <span className={overdue ? "text-destructive" : ""}> · {new Date(t.due_date).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}</span>}
                    {t.priority === "high" && <span className="text-destructive"> · عاجل</span>}
                  </div>
                </div>
                {(t.created_by === user?.id || t.done) && (
                  <button onClick={() => remove(t.id)} className="opacity-0 transition group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}