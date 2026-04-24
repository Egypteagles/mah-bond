import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Upload, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useFamily } from "@/hooks/use-family";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/albums/$albumId")({
  head: () => ({ meta: [{ title: "ألبوم — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <AlbumDetail />
      </AppShell>
    </RequireFamily>
  ),
});

interface Photo {
  id: string;
  image_url: string;
  caption: string | null;
  user_id: string;
  created_at: string;
}

interface AlbumInfo {
  title: string;
  description: string | null;
  created_by: string;
}

function AlbumDetail() {
  const { user } = useAuth();
  const { family } = useFamily();
  const { albumId } = Route.useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<AlbumInfo | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const [{ data: a }, { data: p }] = await Promise.all([
      supabase.from("family_albums").select("title, description, created_by").eq("id", albumId).maybeSingle(),
      supabase.from("album_photos").select("id, image_url, caption, user_id, created_at").eq("album_id", albumId).order("created_at", { ascending: false }),
    ]);
    setAlbum(a as AlbumInfo | null);
    setPhotos((p ?? []) as Photo[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || !family) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("الصورة كبيرة (أقصى 5MB)");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${family.id}/${albumId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("moments").upload(path, file);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("moments").getPublicUrl(path);
      const { error: insErr } = await supabase.from("album_photos").insert({
        album_id: albumId,
        family_id: family.id,
        user_id: user.id,
        image_url: data.publicUrl,
      });
      if (insErr) throw insErr;
      // حدّث صورة الغلاف لو فاضية
      if (photos.length === 0) {
        await supabase.from("family_albums").update({ cover_url: data.publicUrl }).eq("id", albumId);
      }
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function removePhoto(id: string) {
    if (!confirm("تأكيد المسح؟")) return;
    await supabase.from("album_photos").delete().eq("id", id);
    load();
  }

  if (loading) {
    return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!album) {
    return (
      <div className="rounded-3xl bg-card p-6 text-center">
        <p>الألبوم مش موجود</p>
        <Button onClick={() => navigate({ to: "/albums" })} className="mt-3">
          <ArrowRight className="h-4 w-4" /> رجوع
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate({ to: "/albums" })} className="text-xs text-muted-foreground hover:text-foreground">
        ← كل الألبومات
      </button>
      <div className="rounded-3xl bg-gradient-warm p-5 shadow-warm">
        <h1 className="font-display text-2xl font-bold text-foreground">{album.title}</h1>
        {album.description && <p className="mt-1 text-sm text-muted-foreground">{album.description}</p>}
        <p className="mt-2 text-[11px] text-muted-foreground">{photos.length} صورة</p>
      </div>

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-sm font-medium text-primary transition hover:bg-primary/10">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        ضيف صورة
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
      </label>

      <div className="grid grid-cols-3 gap-2">
        {photos.map((p) => (
          <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
            <img src={p.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
            {p.user_id === user?.id && (
              <button onClick={() => removePhoto(p.id)} className="absolute top-1 left-1 rounded-full bg-background/80 p-1 opacity-0 transition group-hover:opacity-100">
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}