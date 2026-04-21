-- Enum لأدوار العائلة
create type public.family_role as enum ('parent', 'child');

-- جدول العائلات
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text,
  invite_code text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ملفات شخصية
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid references public.families(id) on delete set null,
  display_name text not null,
  avatar_url text,
  reminder_time time default '20:00:00',
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- جدول الأدوار منفصل لأمان كامل
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  role family_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, family_id)
);

-- الكبسولة اليومية
create table public.daily_capsules (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  capsule_date date not null,
  question text not null,
  challenge text not null,
  created_at timestamptz not null default now(),
  unique(family_id, capsule_date)
);

-- إجابات السؤال
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.daily_capsules(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  unique(capsule_id, user_id)
);

-- تأكيدات التحدي
create table public.challenge_completions (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.daily_capsules(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique(capsule_id, user_id)
);

-- اللحظات
create table public.moments (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.daily_capsules(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  content text,
  image_url text,
  created_at timestamptz not null default now()
);

-- ردود الأفعال على اللحظات
create table public.moment_reactions (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique(moment_id, user_id, emoji)
);

-- streak لكل عائلة
create table public.streaks (
  family_id uuid primary key references public.families(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_active_date date,
  updated_at timestamptz not null default now()
);

-- تفعيل RLS
alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.daily_capsules enable row level security;
alter table public.answers enable row level security;
alter table public.challenge_completions enable row level security;
alter table public.moments enable row level security;
alter table public.moment_reactions enable row level security;
alter table public.streaks enable row level security;

-- security definer functions لتجنب الـ recursion
create or replace function public.get_user_family_id(_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id from public.profiles where id = _user_id limit 1;
$$;

create or replace function public.is_family_member(_user_id uuid, _family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = _user_id and family_id = _family_id
  );
$$;

-- دالة للتأكد من إن الطرفين جاوبوا قبل عرض إجابة الطرف التاني
create or replace function public.both_answered(_capsule_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select count(distinct user_id) from public.answers where capsule_id = _capsule_id) >= 2;
$$;

-- سياسات families
create policy "أعضاء العائلة يشوفوا عائلتهم"
on public.families for select
to authenticated
using (public.is_family_member(auth.uid(), id) or created_by = auth.uid());

create policy "أي مستخدم يقدر ينشئ عائلة"
on public.families for insert
to authenticated
with check (created_by = auth.uid());

create policy "منشئ العائلة يقدر يعدلها"
on public.families for update
to authenticated
using (created_by = auth.uid());

-- سياسات profiles
create policy "أي مستخدم مسجل يشوف ملفات عائلته"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or (family_id is not null and family_id = public.get_user_family_id(auth.uid()))
);

create policy "المستخدم يقدر ينشئ ملفه"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "المستخدم يقدر يعدل ملفه"
on public.profiles for update
to authenticated
using (id = auth.uid());

-- سياسات user_roles
create policy "أعضاء العائلة يشوفوا أدوار عائلتهم"
on public.user_roles for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_family_member(auth.uid(), family_id)
);

create policy "المستخدم يقدر يضيف دوره"
on public.user_roles for insert
to authenticated
with check (user_id = auth.uid());

-- سياسات daily_capsules
create policy "أعضاء العائلة يشوفوا كبسولاتهم"
on public.daily_capsules for select
to authenticated
using (public.is_family_member(auth.uid(), family_id));

create policy "أعضاء العائلة يقدروا ينشئوا كبسولات"
on public.daily_capsules for insert
to authenticated
with check (public.is_family_member(auth.uid(), family_id));

-- سياسات answers — الإجابة الخاصة دايماً مرئية لصاحبها، إجابة الطرف التاني فقط بعد ما الاتنين يجاوبوا
create policy "إجابتك دايماً مرئية لك"
on public.answers for select
to authenticated
using (
  user_id = auth.uid()
  or (
    public.is_family_member(auth.uid(), family_id)
    and public.both_answered(capsule_id)
  )
);

create policy "المستخدم يضيف إجابته"
on public.answers for insert
to authenticated
with check (user_id = auth.uid() and public.is_family_member(auth.uid(), family_id));

create policy "المستخدم يعدل إجابته"
on public.answers for update
to authenticated
using (user_id = auth.uid());

-- سياسات challenge_completions
create policy "أعضاء العائلة يشوفوا الإنجازات"
on public.challenge_completions for select
to authenticated
using (public.is_family_member(auth.uid(), family_id));

create policy "المستخدم يأكد إنجازه"
on public.challenge_completions for insert
to authenticated
with check (user_id = auth.uid() and public.is_family_member(auth.uid(), family_id));

create policy "المستخدم يحذف تأكيده"
on public.challenge_completions for delete
to authenticated
using (user_id = auth.uid());

-- سياسات moments
create policy "أعضاء العائلة يشوفوا اللحظات"
on public.moments for select
to authenticated
using (public.is_family_member(auth.uid(), family_id));

create policy "المستخدم ينشئ لحظته"
on public.moments for insert
to authenticated
with check (user_id = auth.uid() and public.is_family_member(auth.uid(), family_id));

create policy "المستخدم يعدل لحظته"
on public.moments for update
to authenticated
using (user_id = auth.uid());

create policy "المستخدم يحذف لحظته"
on public.moments for delete
to authenticated
using (user_id = auth.uid());

-- سياسات moment_reactions
create policy "أعضاء العائلة يشوفوا الردود"
on public.moment_reactions for select
to authenticated
using (
  exists(
    select 1 from public.moments m
    where m.id = moment_id and public.is_family_member(auth.uid(), m.family_id)
  )
);

create policy "المستخدم يضيف رده"
on public.moment_reactions for insert
to authenticated
with check (user_id = auth.uid());

create policy "المستخدم يحذف رده"
on public.moment_reactions for delete
to authenticated
using (user_id = auth.uid());

-- سياسات streaks
create policy "أعضاء العائلة يشوفوا streak عائلتهم"
on public.streaks for select
to authenticated
using (public.is_family_member(auth.uid(), family_id));

create policy "أعضاء العائلة يحدثوا streak"
on public.streaks for all
to authenticated
using (public.is_family_member(auth.uid(), family_id))
with check (public.is_family_member(auth.uid(), family_id));

-- توليد كود عائلة فريد
create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  code text;
  done boolean := false;
begin
  while not done loop
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    done := not exists(select 1 from public.families where invite_code = code);
  end loop;
  return code;
end;
$$;

-- trigger لتحديث updated_at
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at();

-- trigger لإنشاء profile تلقائياً عند التسجيل
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- bucket للصور
insert into storage.buckets (id, name, public)
values ('moments', 'moments', true);

-- سياسات storage: المسار = family_id/filename
create policy "أعضاء العائلة يشوفوا الصور"
on storage.objects for select
to authenticated
using (
  bucket_id = 'moments'
  and public.is_family_member(auth.uid(), (split_part(name, '/', 1))::uuid)
);

create policy "أعضاء العائلة يرفعوا صور"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'moments'
  and public.is_family_member(auth.uid(), (split_part(name, '/', 1))::uuid)
);

create policy "صاحب الصورة يحذفها"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'moments'
  and owner = auth.uid()
);