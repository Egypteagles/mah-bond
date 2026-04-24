import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Calendar as CalIcon, Trash2, Cake, Heart, Star } from "lucide-react";
import { toast } from "sonner";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useFamily } from "@/hooks/use-family";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/events")({
  head: () => ({ meta: [{ title: "تقويم المناسبات — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <EventsPage />
      </AppShell>
    </RequireFamily>
  ),
});

interface FamEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: string;
  is_recurring: boolean;
  created_by: string;
}

const TYPES = [
  { key: "birthday", label: "عيد ميلاد", icon: Cake, color: "text-pink-500 bg-pink-500/10" },
  { key: "anniversary", label: "ذكرى", icon: Heart, color: "text-red-500 bg-red-500/10" },
  { key: "milestone", label: "إنجاز", icon: Star, color: "text-amber-500 bg-amber-500/10" },
  { key: "other", label: "آخر", icon: CalIcon, color: "text-blue-500 bg-blue-500/10" },
] as const;

function EventsPage() {
  const { user } = useAuth();
  const { family } = useFamily();
  const [events, setEvents] = useState<FamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", event_date: "", event_type: "birthday", is_recurring: true });
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!family) return;
    const { data } = await supabase
      .from("family_events")
      .select("id, title, description, event_date, event_type, is_recurring, created_by")
      .eq("family_id", family.id)
      .order("event_date");
    setEvents((data ?? []) as FamEvent[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family?.id]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return events
      .map((e) => {
        const d = new Date(e.event_date);
        let next = new Date(now.getFullYear(), d.getMonth(), d.getDate());
        if (e.is_recurring && next < now) next = new Date(now.getFullYear() + 1, d.getMonth(), d.getDate());
        const days = Math.ceil((next.getTime() - now.getTime()) / 86400000);
        return { ...e, daysUntil: e.is_recurring ? days : Math.ceil((d.getTime() - now.getTime()) / 86400000), nextDate: e.is_recurring ? next : d };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [events]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !family) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("family_events").insert({
        family_id: family.id,
        created_by: user.id,
        title: form.title.trim().slice(0, 80),
        description: form.description.trim().slice(0, 300) || null,
        event_date: form.event_date,
        event_type: form.event_type,
        is_recurring: form.is_recurring,
      });
      if (error) throw error;
      setForm({ title: "", description: "", event_date: "", event_type: "birthday", is_recurring: true });
      setOpen(false);
      load();
      toast.success("اتسجلت المناسبة");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("تأكيد المسح؟")) return;
    await supabase.from("family_events").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">تقويم المناسبات</h1>
          <p className="text-xs text-muted-foreground">عشان متنسوش حاجة مهمة</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" /> مناسبة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>مناسبة جديدة</DialogTitle>
            </DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <div>
                <Label>العنوان</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={80} />
              </div>
              <div>
                <Label>التاريخ</Label>
                <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required dir="ltr" />
              </div>
              <div>
                <Label>النوع</Label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setForm({ ...form, event_type: t.key })}
                      className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-xs transition ${
                        form.event_type === t.key ? "border-primary bg-primary/10" : "border-border"
                      }`}
                    >
                      <t.icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>الوصف (اختياري)</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={300} rows={2} />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                <div className="text-sm">يتكرر سنوياً</div>
                <Switch checked={form.is_recurring} onCheckedChange={(v) => setForm({ ...form, is_recurring: v })} />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
      ) : upcoming.length === 0 ? (
        <div className="rounded-3xl bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">
          لسه مفيش مناسبات. ضيف أعياد ميلاد العيلة وذكرياتكم المهمة.
        </div>
      ) : (
        <div className="space-y-2">
          {upcoming.map((e) => {
            const t = TYPES.find((x) => x.key === e.event_type) ?? TYPES[3];
            const Icon = t.icon;
            return (
              <div key={e.id} className="group flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${t.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-foreground">{e.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {e.nextDate.toLocaleDateString("ar-EG", { day: "numeric", month: "long" })}
                    {e.is_recurring && " · سنوياً"}
                  </div>
                </div>
                <div className="text-left">
                  <div className={`text-sm font-bold ${e.daysUntil <= 7 ? "text-primary" : "text-muted-foreground"}`}>
                    {e.daysUntil === 0 ? "النهارده!" : e.daysUntil < 0 ? "فات" : `${e.daysUntil} يوم`}
                  </div>
                  {e.created_by === user?.id && (
                    <button onClick={() => remove(e.id)} className="opacity-0 transition group-hover:opacity-100">
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
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