import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Loader2, Check, MessageCircle, Target, Camera, MessageSquare, Star, Brain } from "lucide-react";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";

export const Route = createFileRoute("/inbox")({
  head: () => ({ meta: [{ title: "الإشعارات — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <InboxPage />
      </AppShell>
    </RequireFamily>
  ),
});

const ICONS: Record<string, React.ReactNode> = {
  answer: <MessageCircle className="h-4 w-4" />,
  challenge: <Target className="h-4 w-4" />,
  moment: <Camera className="h-4 w-4" />,
  message: <MessageSquare className="h-4 w-4" />,
  goal: <Star className="h-4 w-4" />,
  quiz: <Brain className="h-4 w-4" />,
};

function InboxPage() {
  const { items, loading, unread, markAllRead, markRead } = useNotifications();

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
          <Bell className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">الإشعارات</h1>
          {unread > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <Check className="h-4 w-4" /> اقرأ الكل
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl bg-card p-10 text-center shadow-soft">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">ما فيش إشعارات لسه.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const content = (
              <div
                className={`flex items-start gap-3 rounded-2xl p-4 shadow-soft transition-colors ${
                  n.read_at ? "bg-card opacity-70" : "bg-card border-r-4 border-primary"
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {ICONS[n.type] ?? <Bell className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground">{n.title}</div>
                  {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("ar-EG", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
            if (n.link) {
              return (
                <Link
                  key={n.id}
                  to={n.link}
                  onClick={() => markRead(n.id)}
                  className="block transition-transform hover:-translate-y-0.5"
                >
                  {content}
                </Link>
              );
            }
            return (
              <button key={n.id} onClick={() => markRead(n.id)} className="block w-full text-right">
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}