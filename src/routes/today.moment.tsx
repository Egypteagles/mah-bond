import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Camera, Heart, Trash2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { useFamily, ensureTodayCapsule } from "@/hooks/use-family";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { awardXP } from "@/lib/xp";
import { notifyPartner } from "@/lib/notifications";
import { VoiceRecorder, AudioPlayer } from "@/components/features/voice-recorder";

export const Route = createFileRoute("/today/moment")({
  head: () => ({ meta: [{ title: "لحظة اليوم — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <MomentPage />
      </AppShell>
    </RequireFamily>
  ),
});

interface MomentRow {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  audio_url: string | null;
  created_at: string;
}

function MomentPage() {
  const { user } = useAuth();
  const { family, partnerProfile, profile } = useFamily();
  const [capsuleId, setCapsuleId] = useState<string | null>(null);
  const [moments, setMoments] = useState<MomentRow[]>([]);
  const [reactions, setReactions] = useState<
    { moment_id: string; user_id: string; emoji: string }[]
  >([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!family) return;
    const c = await ensureTodayCapsule(family.id);
    setCapsuleId(c.id);
    const [{ data: m }, { data: r }] = await Promise.all([
      supabase
        .from("moments")
        .select("*")
        .eq("capsule_id", c.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("moment_reactions")
        .select("moment_id, user_id, emoji")
        .in(
          "moment_id",
          ((await supabase.from("moments").select("id").eq("capsule_id", c.id)).data ?? []).map(
            (x) => x.id,
          ),
        ),
    ]);
    setMoments((m ?? []) as MomentRow[]);
    setReactions(r ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family]);

  async function share(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !family || !capsuleId) return;
    if (!text.trim() && !file && !audioBlob) {
      toast.error("اكتب جملة أو ارفع صورة أو سجل صوت");
      return;
    }
    setBusy(true);
    try {
      let imageUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${family.id}/${user.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("moments")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("moments").getPublicUrl(path);
        imageUrl = data.publicUrl;
      }
      let audioUrl: string | null = null;
      if (audioBlob) {
        const path = `${family.id}/moment-${user.id}-${Date.now()}.webm`;
        const { error: upErr } = await supabase.storage
          .from("audio")
          .upload(path, audioBlob, { contentType: audioBlob.type || "audio/webm" });
        if (upErr) throw upErr;
        const { data } = await supabase.storage
          .from("audio")
          .createSignedUrl(path, 60 * 60 * 24 * 30);
        audioUrl = data?.signedUrl ?? null;
      }
      const { error } = await supabase.from("moments").insert({
        capsule_id: capsuleId,
        user_id: user.id,
        family_id: family.id,
        content: text.trim().slice(0, 1000) || null,
        image_url: imageUrl,
        audio_url: audioUrl,
      });
      if (error) throw error;
      toast.success("اتشاركت اللحظة ✨");
      setText("");
      setFile(null);
      setAudioBlob(null);
      await load();
      await Promise.all([
        awardXP(family.id, "moment"),
        notifyPartner({
          familyId: family.id,
          partnerId: partnerProfile?.id,
          type: "moment",
          title: `${profile?.display_name ?? "الطرف التاني"} شارك لحظة جديدة`,
          link: "/today/moment",
        }),
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setBusy(false);
    }
  }

  async function react(momentId: string, emoji: string) {
    if (!user) return;
    const exists = reactions.find(
      (r) => r.moment_id === momentId && r.user_id === user.id && r.emoji === emoji,
    );
    if (exists) {
      await supabase
        .from("moment_reactions")
        .delete()
        .eq("moment_id", momentId)
        .eq("user_id", user.id)
        .eq("emoji", emoji);
    } else {
      await supabase.from("moment_reactions").insert({
        moment_id: momentId,
        user_id: user.id,
        emoji,
      });
    }
    load();
  }

  async function deleteMoment(id: string) {
    if (!confirm("متأكد؟")) return;
    await supabase.from("moments").delete().eq("id", id);
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
      <Link
        to="/today"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" /> رجوع
      </Link>

      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warm-foreground">
        <Camera className="h-4 w-4" /> لحظات اليوم
      </div>

      <form onSubmit={share} className="space-y-3 rounded-3xl bg-card p-5 shadow-soft">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="شارك تفصيلة من يومك... (اختياري)"
          rows={3}
          maxLength={1000}
          className="rounded-2xl border-2"
        />
        <div className="flex items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80">
            <ImagePlus className="h-4 w-4" />
            {file ? file.name.slice(0, 20) : "صورة"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "شارك"}
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {moments.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            لسه ما اتشاركت لحظات اليوم.
          </p>
        )}
        {moments.map((m) => {
          const author =
            m.user_id === user?.id
              ? profile?.display_name ?? "إنت"
              : partnerProfile?.display_name ?? "الطرف التاني";
          const isMine = m.user_id === user?.id;
          const myReactions = reactions.filter((r) => r.moment_id === m.id);
          return (
            <div key={m.id} className="overflow-hidden rounded-2xl bg-card shadow-soft">
              {m.image_url && (
                <img
                  src={m.image_url}
                  alt="moment"
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-muted-foreground">
                    {author} ·{" "}
                    {new Date(m.created_at).toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {isMine && (
                    <button
                      onClick={() => deleteMoment(m.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {m.content && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                    {m.content}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {["❤️", "😂", "🔥", "👏", "🥺"].map((emoji) => {
                    const count = myReactions.filter((r) => r.emoji === emoji).length;
                    const mine = myReactions.some(
                      (r) => r.user_id === user?.id && r.emoji === emoji,
                    );
                    return (
                      <button
                        key={emoji}
                        onClick={() => react(m.id, emoji)}
                        className={`rounded-full px-2.5 py-1 text-xs transition-all ${
                          mine
                            ? "bg-primary/15 ring-1 ring-primary"
                            : "bg-muted hover:bg-muted/70"
                        }`}
                      >
                        {emoji} {count > 0 && <span className="ml-1">{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
