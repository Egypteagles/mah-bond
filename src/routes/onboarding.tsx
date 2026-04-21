import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Heart, Copy, Loader2, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useFamily } from "@/hooks/use-family";

const searchSchema = z.object({
  role: z.enum(["parent", "child"]).optional(),
});

export const Route = createFileRoute("/onboarding")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "إعداد الحساب — بيننا" },
      { name: "description", content: "اربط حسابك بحساب الأب أو الابن." },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, family, loading: famLoading, refresh } = useFamily();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!famLoading && profile?.family_id && family) {
      navigate({ to: "/today" });
    }
  }, [famLoading, profile, family, navigate]);

  // اختيار افتراضي بناءً على ?role=
  useEffect(() => {
    if (mode === "choose" && search.role) {
      setMode(search.role === "parent" ? "create" : "join");
    }
  }, [search.role, mode]);

  if (authLoading || famLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-hero">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Heart className="h-5 w-5" fill="currentColor" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">بيننا</span>
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-warm md:p-8">
          {mode === "choose" && <ChooseStep onSelect={setMode} />}
          {mode === "create" && (
            <CreateFamilyStep onDone={refresh} onBack={() => setMode("choose")} />
          )}
          {mode === "join" && (
            <JoinFamilyStep onDone={refresh} onBack={() => setMode("choose")} />
          )}
        </div>
      </div>
    </div>
  );
}

function ChooseStep({ onSelect }: { onSelect: (m: "create" | "join") => void }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">يلا نبدأ</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        اختار: تنشئ عائلة جديدة (لو إنت الأب) أو تنضم لعائلة موجودة بكود (لو إنت الابن).
      </p>
      <div className="mt-6 space-y-3">
        <button
          onClick={() => onSelect("create")}
          className="group flex w-full items-center gap-4 rounded-2xl border-2 border-border bg-background p-4 text-right transition-all hover:border-primary hover:bg-primary/5"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-foreground">إنشاء عائلة جديدة</div>
            <div className="text-xs text-muted-foreground">للأب — هتاخد كود تبعته للابن</div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-x-1" />
        </button>
        <button
          onClick={() => onSelect("join")}
          className="group flex w-full items-center gap-4 rounded-2xl border-2 border-border bg-background p-4 text-right transition-all hover:border-accent hover:bg-accent/5"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Heart className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-foreground">الانضمام بكود</div>
            <div className="text-xs text-muted-foreground">للابن — أدخل الكود اللي بعتهولك أبوك</div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-x-1" />
        </button>
      </div>
    </div>
  );
}

function CreateFamilyStep({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const { user } = useAuth();
  const [familyName, setFamilyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      // ولّد كود
      const { data: codeData, error: codeErr } = await supabase.rpc("generate_invite_code");
      if (codeErr) throw codeErr;
      const inviteCode = codeData as string;

      // أنشئ العائلة
      const { data: fam, error: famErr } = await supabase
        .from("families")
        .insert({
          name: familyName.trim() || "عائلتنا",
          invite_code: inviteCode,
          created_by: user.id,
        })
        .select()
        .single();
      if (famErr) throw famErr;

      // اربط الـ profile
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ family_id: fam.id })
        .eq("id", user.id);
      if (profErr) throw profErr;

      // أضف الدور
      const { error: roleErr } = await supabase.from("user_roles").insert({
        user_id: user.id,
        family_id: fam.id,
        role: "parent",
      });
      if (roleErr) throw roleErr;

      setCreatedCode(inviteCode);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setLoading(false);
    }
  }

  if (createdCode) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
          <Heart className="h-8 w-8" fill="currentColor" />
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold text-foreground">جاهز!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          ابعت الكود ده لابنك عشان ينضم لعائلتكم:
        </p>
        <div className="mt-6 rounded-2xl bg-gradient-warm p-6">
          <div className="font-display text-4xl font-black tracking-[0.3em] text-foreground">
            {createdCode}
          </div>
        </div>
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={() => {
            navigator.clipboard.writeText(createdCode);
            toast.success("اتنسخ!");
          }}
        >
          <Copy className="h-4 w-4" /> نسخ الكود
        </Button>
        <Button className="mt-3 w-full" onClick={onDone}>
          ابدأ الكبسولة الأولى
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleCreate} className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        ← رجوع
      </button>
      <h2 className="font-display text-xl font-bold text-foreground">عائلتك الجديدة</h2>
      <div>
        <Label htmlFor="famname">اسم العائلة (اختياري)</Label>
        <Input
          id="famname"
          value={familyName}
          onChange={(e) => setFamilyName(e.target.value)}
          placeholder="مثال: عيلة محمد"
          maxLength={50}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "إنشاء عائلة وكود انضمام"}
      </Button>
    </form>
  );
}

function JoinFamilyStep({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length < 4) {
      toast.error("الكود قصير");
      return;
    }
    setLoading(true);
    try {
      // ابحث عن العائلة عن طريق الكود
      const { data: fam, error: famErr } = await supabase
        .from("families")
        .select("id")
        .eq("invite_code", cleanCode)
        .maybeSingle();
      if (famErr) throw famErr;
      if (!fam) {
        toast.error("الكود مش صحيح");
        setLoading(false);
        return;
      }

      // تحقق إن مفيش ابن مرتبط بالفعل
      const { data: existingChild } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("family_id", fam.id)
        .eq("role", "child")
        .maybeSingle();
      if (existingChild) {
        toast.error("في ابن مرتبط بالعائلة دي بالفعل");
        setLoading(false);
        return;
      }

      // اربط الـ profile
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ family_id: fam.id })
        .eq("id", user.id);
      if (profErr) throw profErr;

      const { error: roleErr } = await supabase.from("user_roles").insert({
        user_id: user.id,
        family_id: fam.id,
        role: "child",
      });
      if (roleErr) throw roleErr;

      toast.success("اتربطت بنجاح!");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حصل خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleJoin} className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        ← رجوع
      </button>
      <h2 className="font-display text-xl font-bold text-foreground">أدخل كود العائلة</h2>
      <p className="text-sm text-muted-foreground">
        الكود اللي بعتهولك أبوك من إنشاء العائلة.
      </p>
      <div>
        <Label htmlFor="code">الكود</Label>
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
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "انضمام"}
      </Button>
    </form>
  );
}
