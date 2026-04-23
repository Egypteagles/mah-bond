// تعريف الشارات الموسعة
export interface BadgeDef {
  id: string;
  emoji: string;
  label: string;
  description: string;
  check: (s: BadgeStats) => boolean;
}

export interface BadgeStats {
  current: number;
  longest: number;
  answers: number;
  challenges: number;
  moments: number;
  messages: number;
  goals: number;
  xp: number;
}

export const BADGES: BadgeDef[] = [
  { id: "first-day", emoji: "🌱", label: "أول يوم", description: "بدأتم رحلتكم سوا", check: (s) => s.longest >= 1 },
  { id: "week", emoji: "🌿", label: "أسبوع كامل", description: "٧ أيام متواصلة", check: (s) => s.longest >= 7 },
  { id: "month", emoji: "🌳", label: "شهر متواصل", description: "٣٠ يوم بدون انقطاع", check: (s) => s.longest >= 30 },
  { id: "100", emoji: "🏆", label: "١٠٠ يوم", description: "ميل عظيم", check: (s) => s.longest >= 100 },
  { id: "year", emoji: "👑", label: "سنة كاملة", description: "إنجاز نادر", check: (s) => s.longest >= 365 },
  { id: "answer-10", emoji: "💬", label: "١٠ إجابات", description: "بدأتم تتعرفوا على بعض", check: (s) => s.answers >= 10 },
  { id: "answer-50", emoji: "🗣️", label: "٥٠ إجابة", description: "حوار عميق", check: (s) => s.answers >= 50 },
  { id: "answer-200", emoji: "📚", label: "٢٠٠ إجابة", description: "كتاب مفتوح", check: (s) => s.answers >= 200 },
  { id: "challenge-25", emoji: "🎯", label: "٢٥ تحدي", description: "أنجزتم سوا", check: (s) => s.challenges >= 25 },
  { id: "challenge-100", emoji: "🥇", label: "١٠٠ تحدي", description: "بطلين تحديات", check: (s) => s.challenges >= 100 },
  { id: "moment-25", emoji: "📸", label: "٢٥ لحظة", description: "ألبوم بدأ يكبر", check: (s) => s.moments >= 25 },
  { id: "moment-100", emoji: "🖼️", label: "١٠٠ لحظة", description: "ذكريات لا تُنسى", check: (s) => s.moments >= 100 },
  { id: "msg-50", emoji: "✉️", label: "٥٠ رسالة", description: "تواصل مستمر", check: (s) => s.messages >= 50 },
  { id: "goal-1", emoji: "⭐", label: "أول هدف", description: "أنجزتم هدف أسبوعي", check: (s) => s.goals >= 1 },
  { id: "goal-10", emoji: "🌟", label: "١٠ أهداف", description: "أنجزتم ١٠ أهداف", check: (s) => s.goals >= 10 },
  { id: "level-5", emoji: "💎", label: "المستوى ٥", description: "وصلتم لمستوى متقدم", check: (s) => s.xp >= 50 * 16 },
  { id: "level-10", emoji: "🌌", label: "المستوى ١٠", description: "أساطير", check: (s) => s.xp >= 50 * 81 },
];