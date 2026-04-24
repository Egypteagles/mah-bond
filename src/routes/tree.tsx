import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus, TreePine, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { AppShell, RequireFamily } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useFamily } from "@/hooks/use-family";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/tree")({
  head: () => ({ meta: [{ title: "شجرة العائلة — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <TreePage />
      </AppShell>
    </RequireFamily>
  ),
});

interface Node {
  id: string;
  name: string;
  relation: string;
  parent_node_id: string | null;
  birth_year: number | null;
  notes: string | null;
}

function TreePage() {
  const { user } = useAuth();
  const { family } = useFamily();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", relation: "", parent_node_id: "", birth_year: "", notes: "" });
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!family) return;
    const { data } = await supabase
      .from("family_tree_nodes")
      .select("id, name, relation, parent_node_id, birth_year, notes")
      .eq("family_id", family.id)
      .order("birth_year", { ascending: true, nullsFirst: false });
    setNodes((data ?? []) as Node[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family?.id]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !family) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("family_tree_nodes").insert({
        family_id: family.id,
        created_by: user.id,
        name: form.name.trim().slice(0, 60),
        relation: form.relation.trim().slice(0, 40),
        parent_node_id: form.parent_node_id || null,
        birth_year: form.birth_year ? parseInt(form.birth_year) : null,
        notes: form.notes.trim().slice(0, 500) || null,
      });
      if (error) throw error;
      setForm({ name: "", relation: "", parent_node_id: "", birth_year: "", notes: "" });
      setOpen(false);
      load();
      toast.success("اتضاف للشجرة");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("تأكيد المسح؟")) return;
    await supabase.from("family_tree_nodes").delete().eq("id", id);
    load();
  }

  // بناء شجرة
  const roots = nodes.filter((n) => !n.parent_node_id);
  const childrenOf = (id: string) => nodes.filter((n) => n.parent_node_id === id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">شجرة العائلة</h1>
          <p className="text-xs text-muted-foreground">كل أفراد العيلة في مكان واحد</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" /> فرد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ضيف فرد للشجرة</DialogTitle>
            </DialogHeader>
            <form onSubmit={add} className="space-y-3">
              <div>
                <Label>الاسم</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={60} />
              </div>
              <div>
                <Label>صلة القرابة</Label>
                <Input value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} placeholder="مثلاً: جدي، خالتي، ابن عمي" required maxLength={40} />
              </div>
              <div>
                <Label>سنة الميلاد (اختياري)</Label>
                <Input type="number" value={form.birth_year} onChange={(e) => setForm({ ...form, birth_year: e.target.value })} dir="ltr" min={1900} max={new Date().getFullYear()} />
              </div>
              <div>
                <Label>ابن مين في الشجرة؟ (اختياري)</Label>
                <select
                  className="mt-1 w-full rounded-xl border-2 border-input bg-background px-3 py-2 text-sm"
                  value={form.parent_node_id}
                  onChange={(e) => setForm({ ...form, parent_node_id: e.target.value })}
                >
                  <option value="">— مفيش —</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>{n.name} ({n.relation})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>ملاحظات</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} maxLength={500} />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "إضافة"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
      ) : nodes.length === 0 ? (
        <div className="rounded-3xl bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">
          <TreePine className="mx-auto mb-2 h-12 w-12 opacity-30" />
          ابدأ ببناء شجرتك. ضيف الجدود والأهل وأبناء العم.
        </div>
      ) : (
        <div className="space-y-3">
          {roots.map((n) => (
            <NodeCard key={n.id} node={n} childrenList={childrenOf} depth={0} onRemove={remove} />
          ))}
        </div>
      )}
    </div>
  );
}

function NodeCard({ node, childrenList, depth, onRemove }: { node: Node; childrenList: (id: string) => Node[]; depth: number; onRemove: (id: string) => void }) {
  const kids = childrenList(node.id);
  return (
    <div style={{ marginInlineStart: depth * 16 }}>
      <div className="group flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-foreground">{node.name}</div>
          <div className="text-[11px] text-muted-foreground">
            {node.relation}{node.birth_year && ` · ${node.birth_year}`}
          </div>
          {node.notes && <div className="mt-1 text-xs text-muted-foreground">{node.notes}</div>}
        </div>
        <button onClick={() => onRemove(node.id)} className="opacity-0 transition group-hover:opacity-100">
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
      {kids.length > 0 && (
        <div className="mt-2 space-y-2 border-r-2 border-dashed border-border pr-2">
          {kids.map((k) => (
            <NodeCard key={k.id} node={k} childrenList={childrenList} depth={depth + 1} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}