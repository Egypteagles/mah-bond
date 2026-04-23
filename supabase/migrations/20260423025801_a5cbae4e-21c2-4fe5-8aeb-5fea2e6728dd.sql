
-- استبدال السياسة العامة بسياسة محدودة بأعضاء العائلة
DROP POLICY IF EXISTS "ملفات الصوت مرئية للجميع" ON storage.objects;
DROP POLICY IF EXISTS "المستخدمون يرفعون ملفاتهم الصوتية" ON storage.objects;
DROP POLICY IF EXISTS "المستخدمون يمسحون ملفاتهم الصوتية" ON storage.objects;

-- جعل bucket خاص
UPDATE storage.buckets SET public = false WHERE id = 'audio';

CREATE POLICY "أعضاء العائلة يشوفوا الصوت بتاعهم"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'audio' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT family_id FROM public.profiles WHERE id = auth.uid() AND family_id IS NOT NULL
  )
);

CREATE POLICY "أعضاء العائلة يرفعوا في فولدر عائلتهم"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'audio' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT family_id FROM public.profiles WHERE id = auth.uid() AND family_id IS NOT NULL
  )
);

CREATE POLICY "أعضاء العائلة يمسحوا ملفات عائلتهم"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'audio' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT family_id FROM public.profiles WHERE id = auth.uid() AND family_id IS NOT NULL
  )
);
