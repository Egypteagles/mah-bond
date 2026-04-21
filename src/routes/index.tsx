import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Heart, MessageCircle, Target, Camera, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "بيننا — تطبيق يومي يقرّب الأب من ابنه" },
      {
        name: "description",
        content:
          "كل يوم سؤال، تحدي، ولحظة. وحتى لو دخلتم في أوقات مختلفة، تفضلون قريبين من بعض.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/today" });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Heart className="h-5 w-5" fill="currentColor" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">بيننا</span>
        </div>
        <Link to="/auth">
          <Button variant="ghost" size="sm">
            تسجيل الدخول
          </Button>
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:pt-12">
        <section className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-warm/60 px-4 py-1.5 text-xs font-medium text-warm-foreground">
            <Flame className="h-3.5 w-3.5 text-flame" />
            <span>دقايق في اليوم تكفي</span>
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-black leading-[1.15] text-foreground md:text-6xl">
            بينك وبين ابنك،{" "}
            <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
              مساحة يومية
            </span>{" "}
            تخصكم
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            كبسولة بسيطة كل يوم: سؤال تتعرفوا أكتر، تحدي تعملوه سوا، ولحظة تشاركوها.
            حتى لو ما اتقابلتوش، تفضلوا قريبين.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/auth" search={{ role: "parent" }}>
              <Button size="lg" className="w-full min-w-44 shadow-warm sm:w-auto">
                ابدأ كأب
              </Button>
            </Link>
            <Link to="/auth" search={{ role: "child" }}>
              <Button
                size="lg"
                variant="outline"
                className="w-full min-w-44 border-2 sm:w-auto"
              >
                ابدأ كابن
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:mt-24 md:grid-cols-3">
          <FeatureCard
            icon={<MessageCircle className="h-6 w-6" />}
            title="سؤال اليوم"
            description="سؤال يومي يكشف جوانب جديدة. الإجابة بتظهر بس لما تجاوبوا الاتنين."
            color="primary"
          />
          <FeatureCard
            icon={<Target className="h-6 w-6" />}
            title="تحدي مشترك"
            description="مهمة بسيطة لطيفة تعملوها كل واحد في وقته، وتحتفلوا بإنجازها."
            color="accent"
          />
          <FeatureCard
            icon={<Camera className="h-6 w-6" />}
            title="لحظة من يومك"
            description="صورة، رسالة قصيرة، أو تأمل. تشاركوا تفاصيل اليوم اللي بيفوت."
            color="warm"
          />
        </section>

        <section className="mt-16 rounded-3xl bg-card p-6 shadow-soft md:mt-24 md:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              ليه "بيننا"؟
            </h2>
            <p className="mt-4 text-muted-foreground">
              المراهقة مرحلة فيها كتير حوارات صعبة وأبعاد جديدة. "بيننا" بيدي مساحة يومية
              منظمة، بدون ضغط، عشان تفضلوا تتعرفوا على بعض. كل يوم خطوة صغيرة، ومع الوقت
              بتتجمع ذكريات حقيقية.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> لا يحتاج تواجد متزامن
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" /> بيانات خاصة بينكم
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-flame" /> مكافآت تحفيزية
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "primary" | "accent" | "warm";
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent",
    warm: "bg-warm text-warm-foreground",
  };
  return (
    <div className="group rounded-2xl bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-warm">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClasses[color]}`}
      >
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
