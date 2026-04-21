import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "./content";

// نحسب streak: يوم نشط = الطرفين جاوبوا السؤال
export async function recomputeStreak(familyId: string) {
  // اجلب آخر ٦٠ يوم من الكبسولات + إجاباتها
  const { data: capsules } = await supabase
    .from("daily_capsules")
    .select("id, capsule_date, answers(user_id)")
    .eq("family_id", familyId)
    .order("capsule_date", { ascending: false })
    .limit(60);

  if (!capsules) return;

  // أيام نشطة (الطرفين جاوبوا)
  const activeDays = new Set<string>();
  for (const c of capsules as Array<{ capsule_date: string; answers: Array<{ user_id: string }> }>) {
    const uniqueUsers = new Set(c.answers.map((a) => a.user_id));
    if (uniqueUsers.size >= 2) activeDays.add(c.capsule_date);
  }

  // احسب streak الحالي بدءاً من اليوم نازل
  const today = todayISO();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  let current = 0;
  // ابدأ من اليوم لو نشط، أو امبارح
  let cursor = activeDays.has(today) ? today : activeDays.has(yesterday) ? yesterday : null;

  while (cursor && activeDays.has(cursor)) {
    current++;
    const d = new Date(cursor);
    d.setDate(d.getDate() - 1);
    cursor = d.toISOString().split("T")[0];
  }

  // اطول streak تاريخياً
  const sortedDates = Array.from(activeDays).sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sortedDates) {
    if (prev) {
      const prevDate = new Date(prev);
      prevDate.setDate(prevDate.getDate() + 1);
      const expected = prevDate.toISOString().split("T")[0];
      if (d === expected) run++;
      else run = 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = d;
  }
  if (current > longest) longest = current;

  await supabase.from("streaks").upsert({
    family_id: familyId,
    current_streak: current,
    longest_streak: longest,
    last_active_date: cursor ?? null,
    updated_at: new Date().toISOString(),
  });
}
