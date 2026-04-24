import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus, ImageIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useFamily } from "@/hooks/use-family";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/albums")({
  head: () => ({ meta: [{ title: "ألبومات الصور — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <AlbumsPage />
      </AppShell>
    </RequireFamily>
  ),
});

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  created_at: string;
  created_by: string;
}

function AlbumsPage() {
  const { user } = useAuth();
  const { family } = useFamily();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!family) return;
    const { data } = await supabase
      .from("family_albums")
      .select("id, title, description, cover_url, created_at, created_by")
      .eq("family_id", family.id)
      .order("created_at", { ascending: false });
    setAlbums((data ?? []) as Album[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family?.id]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !family || !title.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("family_albums").insert({
        family_id: family.id,
        created_by: user.id,
        title: title.trim().slice(0, 80),
        description: desc.trim().slice(0, 300) || null,
      });
      if (error) throw error;
      setTitle("");
      setDesc("");
      setOpen(false);
      load();
      toast.success("اتعمل الألبوم");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("هتمسح الألبوم وكل صوره. متأكد؟")) return;
    await supabase.from("family_albums").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">ألبومات الصور</h1>
          <p className="text-xs text-muted-foreground">صور عائلتكم منظمة في ألبومات</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" /> ألبوم
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ألبوم جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <div>
                <Label htmlFor="t">العنوان</Label>
                <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={80} />
              </div>
              <div>
                <Label htmlFor="d">الوصف (اختياري)</Label>
                <Textarea id="d" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={300} rows={3} />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "إنشاء"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : albums.length === 0 ? (
        <div className="rounded-3xl bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">
          لسه مفيش ألبومات. أنشئ واحد واتجمعوا فيه على الذكريات.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {albums.map((a) => (
            <div key={a.id} className="group relative overflow-hidden rounded-2xl bg-card shadow-soft">
              <Link
                to="/albums/$albumId"
                params={{ albumId: a.id }}
                className="block"
              >
                <div className="aspect-square bg-gradient-warm">
                  {a.cover_url ? (
                    <img src={a.cover_url} alt={a.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="truncate text-sm font-bold text-foreground">{a.title}</div>
                  {a.description && (
                    <div className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                      {a.description}
                    </div>
                  )}
                </div>
              </Link>
              {a.created_by === user?.id && (
                <button
                  onClick={() => remove(a.id)}
                  className="absolute top-2 left-2 rounded-full bg-background/80 p-1.5 opacity-0 transition group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}