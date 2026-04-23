
-- 1. جدول الرسائل (الدردشة الخاصة)
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT,
  audio_url TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_family ON public.messages(family_id, created_at DESC);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "أعضاء العائلة يشوفوا الرسايل"
ON public.messages FOR SELECT TO authenticated
USING (is_family_member(auth.uid(), family_id));

CREATE POLICY "أعضاء العائلة يبعتوا رسايل"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND is_family_member(auth.uid(), family_id));

CREATE POLICY "المستخدم يحدث رسايله"
ON public.messages FOR UPDATE TO authenticated
USING (is_family_member(auth.uid(), family_id));

CREATE POLICY "المستخدم يمسح رسالته"
ON public.messages FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- 2. تعليقات على إجابات سؤال اليوم
CREATE TABLE public.answer_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  answer_id UUID NOT NULL REFERENCES public.answers(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_answer_comments_answer ON public.answer_comments(answer_id);
ALTER TABLE public.answer_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "أعضاء العائلة يشوفوا التعليقات"
ON public.answer_comments FOR SELECT TO authenticated
USING (is_family_member(auth.uid(), family_id) AND both_answered((SELECT capsule_id FROM public.answers WHERE id = answer_id)));

CREATE POLICY "المستخدم يضيف تعليقه"
ON public.answer_comments FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND is_family_member(auth.uid(), family_id));

CREATE POLICY "المستخدم يمسح تعليقه"
ON public.answer_comments FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- 3. الأهداف الأسبوعية
CREATE TABLE public.weekly_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_count INTEGER NOT NULL DEFAULT 7,
  week_start DATE NOT NULL,
  completed_by_creator BOOLEAN NOT NULL DEFAULT false,
  completed_by_partner BOOLEAN NOT NULL DEFAULT false,
  progress_creator INTEGER NOT NULL DEFAULT 0,
  progress_partner INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_weekly_goals_family ON public.weekly_goals(family_id, week_start DESC);
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "أعضاء العائلة يشوفوا الأهداف"
ON public.weekly_goals FOR SELECT TO authenticated
USING (is_family_member(auth.uid(), family_id));

CREATE POLICY "أعضاء العائلة ينشئوا هدف"
ON public.weekly_goals FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND is_family_member(auth.uid(), family_id));

CREATE POLICY "أعضاء العائلة يحدثوا الهدف"
ON public.weekly_goals FOR UPDATE TO authenticated
USING (is_family_member(auth.uid(), family_id));

CREATE POLICY "منشئ الهدف يحذفه"
ON public.weekly_goals FOR DELETE TO authenticated
USING (created_by = auth.uid());

CREATE TRIGGER weekly_goals_updated
BEFORE UPDATE ON public.weekly_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. استبيان التوافق
CREATE TABLE public.compatibility_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL, -- YYYY-MM
  questions JSONB NOT NULL, -- [{q,options:[]}]
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_id, month_key)
);
ALTER TABLE public.compatibility_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "أعضاء العائلة يشوفوا الاستبيان"
ON public.compatibility_quizzes FOR SELECT TO authenticated
USING (is_family_member(auth.uid(), family_id));

CREATE POLICY "أعضاء العائلة ينشئوا الاستبيان"
ON public.compatibility_quizzes FOR INSERT TO authenticated
WITH CHECK (is_family_member(auth.uid(), family_id));

CREATE TABLE public.compatibility_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.compatibility_quizzes(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  answers JSONB NOT NULL, -- [choiceIndex, ...]
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quiz_id, user_id)
);
ALTER TABLE public.compatibility_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "أعضاء العائلة يشوفوا إجابات التوافق"
ON public.compatibility_answers FOR SELECT TO authenticated
USING (is_family_member(auth.uid(), family_id));

CREATE POLICY "المستخدم يضيف إجابته في التوافق"
ON public.compatibility_answers FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND is_family_member(auth.uid(), family_id));

CREATE POLICY "المستخدم يحدث إجابته في التوافق"
ON public.compatibility_answers FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- 5. صندوق الإشعارات الداخلية
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'answer','challenge','moment','message','goal'
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدم يشوف إشعاراته"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "أعضاء العائلة يبعتوا إشعارات لبعض"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (is_family_member(auth.uid(), family_id));

CREATE POLICY "المستخدم يحدث إشعاراته"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "المستخدم يمسح إشعاراته"
ON public.notifications FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- 6. إضافة audio_url للإجابات واللحظات
ALTER TABLE public.answers ADD COLUMN audio_url TEXT;
ALTER TABLE public.moments ADD COLUMN audio_url TEXT;

-- 7. إضافة xp_total للستريك
ALTER TABLE public.streaks ADD COLUMN xp_total INTEGER NOT NULL DEFAULT 0;

-- 8. bucket صوتي
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "ملفات الصوت مرئية للجميع"
ON storage.objects FOR SELECT TO authenticated, anon
USING (bucket_id = 'audio');

CREATE POLICY "المستخدمون يرفعون ملفاتهم الصوتية"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio' AND auth.uid() IS NOT NULL);

CREATE POLICY "المستخدمون يمسحون ملفاتهم الصوتية"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'audio' AND auth.uid() IS NOT NULL);

-- 9. تفعيل realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
