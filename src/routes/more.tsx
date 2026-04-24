import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Image as ImageIcon,
  Calendar,
  TreePine,
  Vote,
  ListChecks,
  Sparkles,
  Gift,
  Users,
  BarChart3,
  Brain,
  MessageSquare,
  Star,
  Trophy,
  Settings,
  Archive,
} from "lucide-react";
import { AppShell, RequireFamily } from "@/components/app-shell";

export const Route = createFileRoute("/more")({
  head: () => ({ meta: [{ title: "كل المزايا — بيننا" }] }),
  component: () => (
    <RequireFamily>
      <AppShell>
        <MorePage />
      </AppShell>
    </RequireFamily>
  ),
});

const SECTIONS = [
  {
    title: "ذكريات وتوثيق",
    items: [
      { to: "/albums", icon: ImageIcon, label: "ألبومات الصور", desc: "صور العائلة منظمة في ألبومات" },
      { to: "/events", icon: Calendar, label: "تقويم المناسبات", desc: "أعياد ميلاد، ذكريات، مناسبات" },
      { to: "/tree", icon: TreePine, label: "شجرة العائلة", desc: "كل أفراد العائلة بصرياً" },
      { to: "/yearly", icon: Gift, label: "صندوق الذكريات السنوي", desc: "أهم لحظات السنة في مكان واحد" },
      { to: "/archive", icon: Archive, label: "أرشيف الكبسولات", desc: "كل أيامكم السابقة" },
    ],
  },
  {
    title: "تواصل وقرارات",
    items: [
      { to: "/chat", icon: MessageSquare, label: "دردشة العائلة", desc: "رسائل نصية وصوتية فورية" },
      { to: "/decisions", icon: Vote, label: "تصويت عائلي", desc: "خدوا قرارات مع بعض" },
      { to: "/tasks", icon: ListChecks, label: "مهام منزلية", desc: "نظموا الشغل البيتي" },
    ],
  },
  {
    title: "إنجازات وتحفيز",
    items: [
      { to: "/goals", icon: Star, label: "أهداف أسبوعية", desc: "حدد هدف وحققوه مع بعض" },
      { to: "/quiz", icon: Brain, label: "اختبار التوافق", desc: "كل شهر، اعرف بعض أكتر" },
      { to: "/achievements", icon: Trophy, label: "الإنجازات والشارات", desc: "كل اللي حققتوه" },
      { to: "/family-badges", icon: Sparkles, label: "شارات العائلة", desc: "إنجازات مشتركة" },
      { to: "/stats", icon: BarChart3, label: "إحصائيات العائلة", desc: "تحليل تفاعلكم" },
    ],
  },
  {
    title: "الحساب",
    items: [
      { to: "/families", icon: Users, label: "إدارة العائلات", desc: "بدّل أو انضم لعائلة" },
      { to: "/settings", icon: Settings, label: "الإعدادات", desc: "ملفك الشخصي والتنبيهات" },
    ],
  },
] as const;

function MorePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">كل المزايا</h1>
        <p className="mt-1 text-sm text-muted-foreground">كل اللي تقدر تعمله مع عائلتك في مكان واحد.</p>
      </div>
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <h2 className="mb-2 px-1 font-display text-sm font-bold text-muted-foreground">{section.title}</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft transition hover:shadow-warm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 leading-tight">
                    <div className="text-sm font-bold text-foreground">{item.label}</div>
                    <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}