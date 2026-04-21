import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Heart, Home, Archive, Trophy, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useFamily } from "@/hooks/use-family";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const { family, profile, role } = useFamily();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await signOut();
    navigate({ to: "/" });
  }

  const navItems = [
    { to: "/today", label: "اليوم", icon: Home },
    { to: "/archive", label: "الأرشيف", icon: Archive },
    { to: "/achievements", label: "الإنجازات", icon: Trophy },
    { to: "/settings", label: "الإعدادات", icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/today" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Heart className="h-4 w-4" fill="currentColor" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-sm font-bold text-foreground">
                {family?.name ?? "بيننا"}
              </span>
              {profile && (
                <span className="text-[11px] text-muted-foreground">
                  {profile.display_name} · {role === "parent" ? "أب" : role === "child" ? "ابن" : ""}
                </span>
              )}
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to ||
                (item.to !== "/today" && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="ml-2">
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>

          <Button variant="ghost" size="icon" onClick={handleLogout} className="md:hidden">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>

      {/* Bottom nav للموبايل */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to ||
              (item.to !== "/today" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "fill-primary/20" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function RequireFamily({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { profile, family, loading: famLoading } = useFamily();
  const navigate = useNavigate();

  if (authLoading || famLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    navigate({ to: "/auth" });
    return null;
  }

  if (!profile?.family_id || !family) {
    navigate({ to: "/onboarding" });
    return null;
  }

  return <>{children}</>;
}
