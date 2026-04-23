// نظام نقاط الخبرة والمستويات
import { supabase } from "@/integrations/supabase/client";

export const XP_REWARDS = {
  answer: 10,
  challenge: 15,
  moment: 8,
  message: 2,
  goal_complete: 25,
  quiz_complete: 30,
  daily_streak_bonus: 5,
} as const;

export type XPSource = keyof typeof XP_REWARDS;

// المستوى = sqrt(xp/50) مدور لتحت + 1 → كل مستوى أصعب من اللي قبله
export function levelFromXP(xp: number): { level: number; current: number; needed: number; percent: number } {
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const xpForCurrent = (level - 1) * (level - 1) * 50;
  const xpForNext = level * level * 50;
  const current = xp - xpForCurrent;
  const needed = xpForNext - xpForCurrent;
  const percent = Math.min(100, Math.round((current / needed) * 100));
  return { level, current, needed, percent };
}

export const LEVEL_TITLES: Record<number, string> = {
  1: "مبتدئ",
  2: "متعارف",
  3: "صديق",
  4: "صاحب",
  5: "أنيس",
  6: "حبيب",
  7: "رفيق درب",
  8: "روح واحدة",
  9: "نبض مشترك",
  10: "أسطورة",
};

export function levelTitle(level: number): string {
  if (level >= 10) return LEVEL_TITLES[10];
  return LEVEL_TITLES[level] ?? "مبتدئ";
}

export async function awardXP(familyId: string, source: XPSource) {
  const reward = XP_REWARDS[source];
  const { data: row } = await supabase
    .from("streaks")
    .select("xp_total")
    .eq("family_id", familyId)
    .maybeSingle();
  const current = row?.xp_total ?? 0;
  await supabase
    .from("streaks")
    .upsert({ family_id: familyId, xp_total: current + reward, updated_at: new Date().toISOString() });
}