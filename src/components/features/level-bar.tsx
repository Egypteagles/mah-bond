import { Sparkles } from "lucide-react";
import { levelFromXP, levelTitle } from "@/lib/xp";

export function LevelBar({ xp, compact }: { xp: number; compact?: boolean }) {
  const { level, current, needed, percent } = levelFromXP(xp);
  const title = levelTitle(level);

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="font-bold text-primary">المستوى {level}</span>
        <span className="text-muted-foreground">· {title}</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-warm">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-display text-lg font-black text-foreground">المستوى {level}</div>
            <div className="text-xs text-muted-foreground">{title}</div>
          </div>
        </div>
        <div className="text-left">
          <div className="font-mono text-sm font-bold text-foreground" dir="ltr">{xp} XP</div>
          <div className="text-[10px] text-muted-foreground" dir="ltr">{current}/{needed}</div>
        </div>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-l from-primary to-primary-glow transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}