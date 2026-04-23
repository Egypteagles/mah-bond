// أسئلة استبيان التوافق الشهري
export interface QuizQuestion {
  q: string;
  options: string[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { q: "إيه أكتر حاجة بتفرحه/بتفرحك؟", options: ["النجاح في المدرسة/الشغل", "وقت مع العيلة", "الخروج مع أصحاب", "ممارسة هواية"] },
  { q: "إيه أحسن طريقة عشان نقعد سوا؟", options: ["نتفرج على فيلم", "نلعب لعبة", "نتمشى ونتكلم", "نطبخ سوا"] },
  { q: "إيه الأكلة المفضلة عنده/عندك؟", options: ["كشري/فول/طعمية", "بيتزا/برجر", "مشويات", "أكل بيتي"] },
  { q: "إيه نوع المزاج اللي بيتعامل/بتتعامل بيه أكتر؟", options: ["هادي ومرح", "حماسي ونشيط", "مفكر وعميق", "عملي وسريع"] },
  { q: "إيه أكبر هم بياله/بيالك دلوقتي؟", options: ["الدراسة/الشغل", "علاقات اجتماعية", "صحة", "المستقبل"] },
  { q: "إيه أحسن وقت في اليوم بالنسبة له/لك؟", options: ["الصبح بدري", "الظهر", "المغرب", "بعد منتصف الليل"] },
  { q: "إيه نوع الموسيقى المفضل؟", options: ["شعبي/مهرجانات", "كلاسيك/طرب", "بوب/راب", "روك/ميتال"] },
  { q: "لو تسافروا سوا، تختاروا فين؟", options: ["البحر", "جبل/طبيعة", "مدينة جديدة", "بلد بعيد"] },
  { q: "إيه أكتر صفة شخصية بيتميز/بتتميز بيها؟", options: ["الصبر", "الشجاعة", "الذكاء", "الحنان"] },
  { q: "إيه أحسن طريقة للتعبير عن المشاعر؟", options: ["الكلام المباشر", "الأفعال", "الكتابة", "الهدايا"] },
];

export function pickMonthlyQuestions(monthKey: string, n = 5): QuizQuestion[] {
  let h = 0;
  for (let i = 0; i < monthKey.length; i++) h = (h * 31 + monthKey.charCodeAt(i)) >>> 0;
  const indices = new Set<number>();
  let cursor = h;
  while (indices.size < n) {
    indices.add(cursor % QUIZ_QUESTIONS.length);
    cursor = (cursor * 1103515245 + 12345) >>> 0;
  }
  return Array.from(indices).map((i) => QUIZ_QUESTIONS[i]);
}

export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function calcCompatibility(
  a: number[],
  b: number[],
): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let matches = 0;
  for (let i = 0; i < a.length; i++) if (a[i] === b[i]) matches++;
  return Math.round((matches / a.length) * 100);
}