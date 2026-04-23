import { useEffect, useState } from "react";
import { Loader2, MessageSquare, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { ProfileRow } from "@/hooks/use-family";

interface CommentRow {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface Props {
  answerId: string;
  familyId: string;
  myProfile: ProfileRow | null;
  partnerProfile: ProfileRow | null;
}

export function AnswerComments({ answerId, familyId, myProfile, partnerProfile }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("answer_comments")
      .select("id, user_id, content, created_at")
      .eq("answer_id", answerId)
      .order("created_at", { ascending: true });
    setComments((data ?? []) as CommentRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answerId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("answer_comments").insert({
        answer_id: answerId,
        family_id: familyId,
        user_id: user.id,
        content: text.trim().slice(0, 500),
      });
      if (error) throw error;
      setText("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await supabase.from("answer_comments").delete().eq("id", id);
    load();
  }

  return (
    <div className="mt-3 border-t border-border/50 pt-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <MessageSquare className="h-3.5 w-3.5" />
        تعليقات ({comments.length})
      </div>
      {loading ? (
        <Loader2 className="mt-2 h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <div className="mt-2 space-y-2">
          {comments.map((c) => {
            const isMine = c.user_id === user?.id;
            const author = isMine
              ? myProfile?.display_name ?? "إنت"
              : partnerProfile?.display_name ?? "الطرف التاني";
            return (
              <div
                key={c.id}
                className={`group rounded-xl px-3 py-2 text-sm ${
                  isMine ? "bg-primary/10" : "bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {author}
                  </span>
                  {isMine && (
                    <button
                      onClick={() => remove(c.id)}
                      className="opacity-0 transition group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap leading-relaxed text-foreground">
                  {c.content}
                </p>
              </div>
            );
          })}
        </div>
      )}
      <form onSubmit={send} className="mt-2 flex items-end gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب تعليق..."
          rows={1}
          maxLength={500}
          className="min-h-[40px] resize-none rounded-xl border-2 text-sm"
        />
        <Button type="submit" size="sm" disabled={busy || !text.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}