import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Plus, Users, LogIn, Heart, Check, ArrowLeft, LogOut, Crown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFamily, type FamilyRole } from "@/hooks/use-family";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/families")({
  head: () => ({
    meta: [
      { title: "عائلاتي — بيننا" },
      { name: "description", content: "بدّل بين عائلاتك أو انضم لعائلة جديدة." },
    ],
  }),
  component: FamiliesPage,
});

const ROLE_LABELS: Record<FamilyRole, string> = {
  parent: "أب/والد",
  child: "ابن/ابنة",
  mother: "أم",
  father: "أب",
  sibling: "أخ/أخت",
  grandparent: "جد/جدة",
  other: "آخر",
};

function FamiliesPage() {
  const { user, signOut } = useAuth();
  const { families, family, role, members, loading, switchFamily, refresh } = useFamily();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"list" | "create" | "join">("list");
  const [switching, setSwitching] = useState<string | null>(null);
  const [memberRoles, setMemberRoles] = useState<Record<string, FamilyRole>>({});

  // جلب أدوار أعضاء العائلة النشطة
  useEffect(() => {
    if (!family) {
      setMemberRoles({});
      return;
    }
    supabase
      .from("family_members")
      .select("user_id, role")
      .eq("family_id", family.id)
      .then(({ data }) => {
        const map: Record<string, FamilyRole> = {};
        (data ?? []).forEach((r) => {
          map[r.user_id] = r.role as FamilyRole;
        });
        setMemberRoles(map);
      });
  }, [family?.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-hero">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate({ to: "/auth" });
    return null;
  }

  async function handleSwitch(id: string) {
    setSwitching(id);
    try {
      await switchFamily(id);
      toast.success("اتبدّلت العائلة");
      navigate({ to: "/today" });
    } finally {
      setSwitching(null);
    }
  }

  async function handleLeave(id: string, name: string | null) {
    if (!user) return;
    if (!confirm(`هتخرج من "${name ?? "العائلة"}". متأكد؟`)) return;
    const { error } = await supabase.from("family_members").delete().eq("user_id", user.id).eq("family_id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (family?.id === id) {
      await supabase.from("profiles").update({ active_family_id: null, family_id: null }).eq("id", user.id);
    }
    toast.success("اتمّ الخروج");
    await refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-hero px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Heart className="h-5 w-5" fill="currentColor" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">بيننا</span>
          </div>
          {family && (
            <Link to="/today" className="text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="inline h-4 w-4" /> رجوع
            </Link>
          )}
        </div>

        {family && mode === "list" && (
          <ActiveFamilyCard
            family={family}
            role={role}
            members={members}
            memberRoles={memberRoles}
          />
        )}

        <div className="rounded-3xl bg-card p-6 shadow-warm">
          {mode === "list" && (
            <ListView
              families={families}
              activeId={family?.id ?? null}
              switching={switching}
              onSwitch={handleSwitch}
              onLeave={handleLeave}
              onCreate={() => setMode("create")}
              onJoin={() => setMode("join")}
              onLogout={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
            />
          )}
          {mode === "create" && <CreateView onBack={() => setMode("list")} onDone={async () => { await refresh(); setMode("list"); }} />}
          {mode === "join" && <JoinView onBack={() => setMode("list")} onDone={async () => { await refresh(); setMode("list"); }} />}
        </div>
      </div>
    </div>
  );
}

function ActiveFamilyCard({
  family,
  role,
  members,
  memberRoles,
}: {
  family: { id: string; name: string | null; invite_code: string };
  role: FamilyRole | null;
  members: ReturnType<typeof useFamily>["members"];
  memberRoles: Record<string, FamilyRole>;
}) {
  const initials = (family.name ?? "ع").trim().charAt(0);
  return (
    <div className="mb-4 rounded-3xl bg-gradient-warm p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-black text-primary-foreground shadow-warm">
          {initials}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              العائلة النشطة
            </span>
            {role && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {ROLE_LABELS[role]}
              </span>
            )}
          </div>
          <h2 className="mt-1 font-display text-lg font-bold text-foreground">
            {family.name ?? "عائلتي"}
          </h2>
          <div className="text-[11px] text-muted-foreground" dir="ltr">
            كود: <span className="font-mono font-bold tracking-widest">{family.invite_code}</span>
          </div>
        </div>
      </div>
      {members.length > 0 && (
        <div className="mt-4 border-t border-border/50 pt-3">
          <div className="mb-2 text-[11px] font-bold text-muted-foreground">
            الأعضاء ({members.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const r = memberRoles[m.id];
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2 rounded-xl bg-card/70 px-2 py-1.5"
                >
                  <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      m.display_name.charAt(0)
                    )}
                  </div>
                  <div className="leading-tight">
                    <div className="text-xs font-bold text-foreground">{m.display_name}</div>
                    {r && (
                      <div className="text-[10px] text-muted-foreground">{ROLE_LABELS[r]}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ListView({
  families,
  activeId,
  switching,
  onSwitch,
  onLeave,
  onCreate,
  onJoin,
  onLogout,
}: {
  families: ReturnType<typeof useFamily>["families"];
  activeId: string | null;
  switching: string | null;
  onSwitch: (id: string) => void;
  onLeave: (id: string, name: string | null) => void;
  onCreate: () => void;
  onJoin: () => void;
  onLogout: () => void;
}) {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">عائلاتي</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        اختار عائلة عشان تدخلها. كل عائلة بياناتها وذكرياتها مستقلة.
      </p>

      <div className="mt-5 space-y-2">
        {families.length === 0 && (
          <div className="rounded-2xl bg-muted/40 p-5 text-center text-sm text-muted-foreground">
            لسه ما عندكش عائلات. أنشئ واحدة أو انضم بكود.
          </div>
        )}
        {families.map((f) => {
          const isActive = f.id === activeId;
          return (
            <div
              key={f.id}
              className={`group flex items-center gap-3 rounded-2xl border-2 p-3 transition-all ${
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/40"
              }`}
            >
              <button
                onClick={() => !isActive && onSwitch(f.id)}
                disabled={isActive || switching === f.id}
                className="flex flex-1 items-center gap-3 text-right"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-warm/40 text-foreground"
                  }`}
                >
                  {switching === f.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isActive ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <Users className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-foreground">{f.name ?? "عائلة"}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {ROLE_LABELS[f.role]} · {f.member_count} عضو · كود {f.invite_code}
                  </div>
                </div>
              </button>
              <button
                onClick={() => onLeave(f.id, f.name)}
                title="خروج من العائلة"
                className="opacity-0 transition group-hover:opacity-100"
              >
                <LogOut className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button onClick={onCreate} variant="default">
          <Plus className="h-4 w-4" /> عائلة جديدة
        </Button>
        <Button onClick={onJoin} variant="outline">
          <LogIn className="h-4 w-4" /> انضمام بكود
        </Button>
      </div>

      <button
        onClick={onLogout}
        className="mt-6 w-full text-center text-xs text-muted-foreground hover:text-foreground"
      >
        تسجيل خروج من الحساب
      </button>
    </div>
  );
}

function CreateView({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [role, setRole] = useState<FamilyRole>("parent");
  const [busy, setBusy] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const { data: codeData, error: codeErr } = await supabase.rpc("generate_invite_code");
      if (codeErr) throw codeErr;
      const inviteCode = codeData as string;
      const { data: fam, error: famErr } = await supabase
        .from("families")
        .insert({ name: name.trim() || "عائلتي", invite_code: inviteCode, created_by: user.id })
        .select()
        .single();
      if (famErr) throw famErr;
      const { error: memErr } = await supabase
        .from("family_members")
        .insert({ user_id: user.id, family_id: fam.id, role });
      if (memErr) throw memErr;
      await supabase.from("profiles").update({ active_family_id: fam.id, family_id: fam.id }).eq("id", user.id);
      setCreatedCode(inviteCode);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setBusy(false);
    }
  }

  if (createdCode) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
          <Heart className="h-8 w-8" fill="currentColor" />
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold text-foreground">جاهز!</h2>
        <p className="mt-2 text-sm text-muted-foreground">ابعت الكود ده لباقي العيلة:</p>
        <div className="mt-6 rounded-2xl bg-gradient-warm p-6">
          <div className="font-display text-4xl font-black tracking-[0.3em] text-foreground">{createdCode}</div>
        </div>
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={() => {
            navigator.clipboard.writeText(createdCode);
            toast.success("اتنسخ");
          }}
        >
          نسخ الكود
        </Button>
        <Button className="mt-3 w-full" onClick={onDone}>
          العودة للقائمة
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleCreate} className="space-y-4">
      <button type="button" onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground">
        ← رجوع
      </button>
      <h2 className="font-display text-xl font-bold text-foreground">إنشاء عائلة جديدة</h2>
      <div>
        <Label htmlFor="famname">اسم العائلة</Label>
        <Input
          id="famname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثلاً: أنا وأمي وأختي"
          maxLength={50}
        />
      </div>
      <div>
        <Label>دورك في العائلة دي</Label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(Object.keys(ROLE_LABELS) as FamilyRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-xl border-2 p-2 text-xs font-medium transition ${
                role === r ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "إنشاء"}
      </Button>
    </form>
  );
}

function JoinView({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [role, setRole] = useState<FamilyRole>("child");
  const [busy, setBusy] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const clean = code.trim().toUpperCase();
    if (clean.length < 4) {
      toast.error("الكود قصير");
      return;
    }
    setBusy(true);
    try {
      const { data: fam, error: famErr } = await supabase
        .from("families")
        .select("id, name")
        .eq("invite_code", clean)
        .maybeSingle();
      if (famErr) throw famErr;
      if (!fam) {
        toast.error("الكود مش صحيح");
        return;
      }
      const { data: existing } = await supabase
        .from("family_members")
        .select("id")
        .eq("family_id", fam.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (existing) {
        toast.error("إنت أصلاً في العائلة دي");
        return;
      }
      const { error: memErr } = await supabase
        .from("family_members")
        .insert({ user_id: user.id, family_id: fam.id, role });
      if (memErr) throw memErr;
      await supabase.from("profiles").update({ active_family_id: fam.id, family_id: fam.id }).eq("id", user.id);
      toast.success(`اتنضميت لـ ${fam.name ?? "العائلة"}`);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleJoin} className="space-y-4">
      <button type="button" onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground">
        ← رجوع
      </button>
      <h2 className="font-display text-xl font-bold text-foreground">الانضمام بكود</h2>
      <div>
        <Label htmlFor="code">كود العائلة</Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          dir="ltr"
          maxLength={10}
          className="text-center font-mono text-xl tracking-widest"
        />
      </div>
      <div>
        <Label>دورك</Label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(Object.keys(ROLE_LABELS) as FamilyRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-xl border-2 p-2 text-xs font-medium transition ${
                role === r ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "انضمام"}
      </Button>
    </form>
  );
}