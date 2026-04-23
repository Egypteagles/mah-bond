import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Send, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFamily } from "@/hooks/use-family";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { VoiceRecorder, AudioPlayer } from "@/components/features/voice-recorder";
import { notifyPartner } from "@/lib/notifications";
import { awardXP } from "@/lib/xp";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "الدردشة — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <ChatPage />
      </AppShell>
    </RequireFamily>
  ),
});

interface MessageRow {
  id: string;
  user_id: string;
  content: string | null;
  audio_url: string | null;
  created_at: string;
}

function ChatPage() {
  const { user } = useAuth();
  const { family, partnerProfile, profile } = useFamily();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function load() {
    if (!family) return;
    const { data } = await supabase
      .from("messages")
      .select("id, user_id, content, audio_url, created_at")
      .eq("family_id", family.id)
      .order("created_at", { ascending: true })
      .limit(200);
    setMessages((data ?? []) as MessageRow[]);
    setLoading(false);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  useEffect(() => {
    if (!family) return;
    load();
    const channel = supabase
      .channel(`messages-${family.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `family_id=eq.${family.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (!user || !family || !partnerProfile) return;
    if (!text.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        family_id: family.id,
        user_id: user.id,
        content: text.trim().slice(0, 2000),
      });
      if (error) throw error;
      setText("");
      await Promise.all([
        notifyPartner({
          familyId: family.id,
          partnerId: partnerProfile.id,
          type: "message",
          title: `${profile?.display_name ?? "الطرف التاني"} بعتلك رسالة`,
          body: text.trim().slice(0, 80),
          link: "/chat",
        }),
        awardXP(family.id, "message"),
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setSending(false);
    }
  }

  async function sendVoice(blob: Blob) {
    if (!user || !family) return;
    setSending(true);
    try {
      const path = `${family.id}/msg-${user.id}-${Date.now()}.webm`;
      const { error: upErr } = await supabase.storage.from("audio").upload(path, blob, {
        contentType: blob.type || "audio/webm",
      });
      if (upErr) throw upErr;
      const { data } = await supabase.storage.from("audio").createSignedUrl(path, 60 * 60 * 24 * 30);
      const { error } = await supabase.from("messages").insert({
        family_id: family.id,
        user_id: user.id,
        audio_url: data?.signedUrl ?? path,
      });
      if (error) throw error;
      if (partnerProfile) {
        await notifyPartner({
          familyId: family.id,
          partnerId: partnerProfile.id,
          type: "message",
          title: `${profile?.display_name ?? "الطرف التاني"} بعتلك رسالة صوتية`,
          link: "/chat",
        });
      }
      await awardXP(family.id, "message");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ في رفع الصوت");
    } finally {
      setSending(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("متأكد؟")) return;
    await supabase.from("messages").delete().eq("id", id);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col">
      <div className="mb-3 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-bold text-foreground">دردشة</h1>
        {partnerProfile && (
          <span className="text-sm text-muted-foreground">مع {partnerProfile.display_name}</span>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-muted/30 p-3">
        {messages.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            ابعت أول رسالة 💬
          </p>
        )}
        {messages.map((m) => {
          const mine = m.user_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
              <div
                className={`group max-w-[80%] rounded-2xl px-4 py-2 shadow-soft ${
                  mine ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
                }`}
              >
                {m.content && <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>}
                {m.audio_url && (
                  <div className="mt-1">
                    <AudioPlayer src={m.audio_url} />
                  </div>
                )}
                <div
                  className={`mt-1 flex items-center gap-2 text-[10px] ${
                    mine ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  <span dir="ltr">
                    {new Date(m.created_at).toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {mine && (
                    <button
                      onClick={() => remove(m.id)}
                      className="opacity-0 transition group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="mt-3 space-y-2 rounded-2xl bg-card p-3 shadow-soft">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب رسالة..."
          rows={2}
          maxLength={2000}
          className="resize-none border-2"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <div className="flex items-center justify-between gap-2">
          <VoiceRecorder onRecorded={sendVoice} disabled={sending} />
          <Button type="submit" disabled={sending || !text.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            إرسال
          </Button>
        </div>
      </form>
    </div>
  );
}