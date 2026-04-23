import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Settings as SettingsIcon, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFamily } from "@/hooks/use-family";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "الإعدادات — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <SettingsPage />
      </AppShell>
    </RequireFamily>
  ),
});

function SettingsPage() {
  const { user } = useAuth();
  const { profile, family, refresh } = useFamily();
  const [name, setName] = useState("");
  const [reminderTime, setReminderTime] = useState("20:00");
  const [notifications, setNotifications] = useState(true);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function exportMemories() {
    if (!family) return;
    setExporting(true);
    try {
      const [caps, ans, moms] = await Promise.all([
        supabase.from("daily_capsules").select("*").eq("family_id", family.id).order("capsule_date"),
        supabase.from("answers").select("*").eq("family_id", family.id).order("created_at"),
        supabase.from("moments").select("*").eq("family_id", family.id).order("created_at"),
      ]);
      const payload = {
        exported_at: new Date().toISOString(),
        family: family.name,
        capsules: caps.data ?? [],
        answers: ans.data ?? [],
        moments: moms.data ?? [],
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `baynana-memories-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("اتصدرت الذكريات");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    if (profile) {
      setName(profile.display_name);
      setReminderTime((profile.reminder_time ?? "20:00:00").slice(0, 5));
      setNotifications(profile.notifications_enabled);
    }
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: name.trim().slice(0, 60),
          reminder_time: `${reminderTime}:00`,
          notifications_enabled: notifications,
        })
        .eq("id", user.id);
      if (error) throw error;
      if (notifications && "Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
      toast.success("اتحفظ ✓");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setBusy(false);
    }
  }

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-bold text-foreground">الإعدادات</h1>
      </div>

      <form onSubmit={save} className="space-y-4 rounded-3xl bg-card p-5 shadow-soft">
        <div>
          <Label htmlFor="name">الاسم</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
          />
        </div>
        <div>
          <Label htmlFor="time">توقيت التذكير اليومي</Label>
          <Input
            id="time"
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            dir="ltr"
          />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
          <div>
            <div className="text-sm font-medium text-foreground">إشعارات يومية</div>
            <div className="text-[11px] text-muted-foreground">تذكير في الوقت المختار</div>
          </div>
          <Switch checked={notifications} onCheckedChange={setNotifications} />
        </div>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ"}
        </Button>
      </form>

      {family && (
        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-bold text-foreground">كود العائلة</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            ابعته لأي حد لسه ما انضمش لعائلتكم.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 rounded-xl bg-warm/40 p-3 text-center font-mono text-2xl font-black tracking-widest">
              {family.invite_code}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(family.invite_code);
                toast.success("اتنسخ");
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-card p-5 shadow-soft">
        <h2 className="font-display text-lg font-bold text-foreground">تصدير الذكريات</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          نزّل كل كبسولاتكم وإجاباتكم ولحظاتكم في ملف واحد.
        </p>
        <Button onClick={exportMemories} disabled={exporting} variant="outline" className="mt-3 w-full">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          تصدير JSON
        </Button>
      </div>
    </div>
  );
}
