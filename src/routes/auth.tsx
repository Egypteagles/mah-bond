import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Heart, ArrowRight, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const searchSchema = z.object({
  role: z.enum(["parent", "child"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — بيننا" },
      { name: "description", content: "ادخل أو سجل حساب جديد للأب أو الابن." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signup");

  useEffect(() => {
    if (!authLoading && user) {
      navigate({ to: "/onboarding" });
    }
  }, [user, authLoading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Heart className="h-5 w-5" fill="currentColor" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">بيننا</span>
        </Link>

        <div className="rounded-3xl bg-card p-6 shadow-warm md:p-8">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">تسجيل جديد</TabsTrigger>
              <TabsTrigger value="signin">دخول</TabsTrigger>
            </TabsList>
            <TabsContent value="signup" className="mt-6">
              <SignUpForm initialRole={search.role ?? "parent"} />
            </TabsContent>
            <TabsContent value="signin" className="mt-6">
              <SignInForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

const signUpSchema = z.object({
  displayName: z.string().trim().min(2, "الاسم قصير جداً").max(60),
  email: z.string().trim().email("بريد إلكتروني غير صحيح").max(255),
  password: z.string().min(6, "الباسورد لازم يكون ٦ حروف على الأقل").max(72),
});

function SignUpForm({ initialRole }: { initialRole: "parent" | "child" }) {
  const [role, setRole] = useState<"parent" | "child">(initialRole);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = signUpSchema.safeParse({ displayName, email, password });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/onboarding`;
      const { error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: result.data.displayName,
            intended_role: role,
          },
        },
      });
      if (error) throw error;
      toast.success("اتسجل حسابك بنجاح! خلصنا الإعداد.");
      navigate({ to: "/onboarding", search: { role } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حصل خطأ";
      if (msg.toLowerCase().includes("already registered")) {
        toast.error("الإيميل ده مسجل قبل كده، جرب تسجل دخول.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="mb-2 block text-sm">أنا</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole("parent")}
            className={`rounded-xl border-2 p-3 text-sm font-medium transition-all ${
              role === "parent"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/40"
            }`}
          >
            👨 الأب
          </button>
          <button
            type="button"
            onClick={() => setRole("child")}
            className={`rounded-xl border-2 p-3 text-sm font-medium transition-all ${
              role === "child"
                ? "border-accent bg-accent/15 text-accent-foreground"
                : "border-border bg-background text-muted-foreground hover:border-accent/40"
            }`}
          >
            🧑 الابن
          </button>
        </div>
      </div>

      <div>
        <Label htmlFor="name">الاسم</Label>
        <Input
          id="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="مثال: أحمد"
          maxLength={60}
          required
        />
      </div>
      <div>
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          dir="ltr"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">كلمة المرور</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="٦ حروف على الأقل"
          dir="ltr"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            متابعة <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}

const signInSchema = z.object({
  email: z.string().trim().email("بريد إلكتروني غير صحيح").max(255),
  password: z.string().min(1, "ادخل كلمة المرور"),
});

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });
      if (error) throw error;
      toast.success("أهلاً بيك تاني!");
      navigate({ to: "/today" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حصل خطأ";
      toast.error(msg.includes("Invalid") ? "البريد أو الباسورد مش صح" : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="login-email">البريد الإلكتروني</Label>
        <Input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          dir="ltr"
          required
        />
      </div>
      <div>
        <Label htmlFor="login-password">كلمة المرور</Label>
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          dir="ltr"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "دخول"}
      </Button>
    </form>
  );
}
