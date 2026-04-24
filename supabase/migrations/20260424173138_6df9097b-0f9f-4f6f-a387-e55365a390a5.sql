-- =========================
-- 1. جدول العضوية متعدد العائلات
-- =========================
create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  family_id uuid not null references public.families(id) on delete cascade,
  role public.family_role not null default 'child',
  nickname text,
  joined_at timestamptz not null default now(),
  unique (user_id, family_id)
);

create index if not exists idx_family_members_user on public.family_members(user_id);
create index if not exists idx_family_members_family on public.family_members(family_id);

alter table public.family_members enable row level security;

-- نقل البيانات الموجودة
insert into public.family_members (user_id, family_id, role)
select p.id, p.family_id, coalesce(ur.role, 'child'::family_role)
from public.profiles p
left join public.user_roles ur on ur.user_id = p.id and ur.family_id = p.family_id
where p.family_id is not null
on conflict (user_id, family_id) do nothing;

-- =========================
-- 2. active_family_id في profiles
-- =========================
alter table public.profiles add column if not exists active_family_id uuid references public.families(id) on delete set null;
update public.profiles set active_family_id = family_id where active_family_id is null and family_id is not null;

-- =========================
-- 3. دالة is_member_of
-- =========================
create or replace function public.is_member_of(_user_id uuid, _family_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.family_members where user_id = _user_id and family_id = _family_id);
$$;

-- =========================
-- 4. RLS لـ family_members
-- =========================
create policy "المستخدم يشوف عضوياته"
on public.family_members for select to authenticated
using (user_id = auth.uid() or public.is_member_of(auth.uid(), family_id));

create policy "المستخدم ينضم لعائلة"
on public.family_members for insert to authenticated
with check (user_id = auth.uid());

create policy "المستخدم يحدث عضويته"
on public.family_members for update to authenticated
using (user_id = auth.uid());

create policy "المستخدم يخرج من عائلة"
on public.family_members for delete to authenticated
using (user_id = auth.uid());

-- =========================
-- 5. ألبومات الصور
-- =========================
create table if not exists public.family_albums (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by uuid not null,
  title text not null,
  description text,
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.family_albums enable row level security;

create policy "أعضاء العائلة يشوفوا الألبومات" on public.family_albums for select to authenticated using (public.is_member_of(auth.uid(), family_id));
create policy "أعضاء العائلة ينشئوا ألبوم" on public.family_albums for insert to authenticated with check (created_by = auth.uid() and public.is_member_of(auth.uid(), family_id));
create policy "المنشئ يحدث الألبوم" on public.family_albums for update to authenticated using (created_by = auth.uid());
create policy "المنشئ يحذف الألبوم" on public.family_albums for delete to authenticated using (created_by = auth.uid());

create table if not exists public.album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.family_albums(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null,
  image_url text not null,
  caption text,
  created_at timestamptz not null default now()
);
alter table public.album_photos enable row level security;

create policy "أعضاء العائلة يشوفوا صور الألبوم" on public.album_photos for select to authenticated using (public.is_member_of(auth.uid(), family_id));
create policy "أعضاء العائلة يضيفوا صور" on public.album_photos for insert to authenticated with check (user_id = auth.uid() and public.is_member_of(auth.uid(), family_id));
create policy "صاحب الصورة يحذفها" on public.album_photos for delete to authenticated using (user_id = auth.uid());

-- =========================
-- 6. تقويم المناسبات
-- =========================
create table if not exists public.family_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by uuid not null,
  title text not null,
  description text,
  event_date date not null,
  event_type text not null default 'other',
  is_recurring boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_family_events_date on public.family_events(family_id, event_date);
alter table public.family_events enable row level security;

create policy "أعضاء العائلة يشوفوا المناسبات" on public.family_events for select to authenticated using (public.is_member_of(auth.uid(), family_id));
create policy "أعضاء العائلة ينشئوا مناسبة" on public.family_events for insert to authenticated with check (created_by = auth.uid() and public.is_member_of(auth.uid(), family_id));
create policy "المنشئ يحدث المناسبة" on public.family_events for update to authenticated using (created_by = auth.uid());
create policy "المنشئ يحذف المناسبة" on public.family_events for delete to authenticated using (created_by = auth.uid());

-- =========================
-- 7. شجرة العائلة
-- =========================
create table if not exists public.family_tree_nodes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  relation text not null,
  parent_node_id uuid references public.family_tree_nodes(id) on delete set null,
  birth_year int,
  avatar_url text,
  notes text,
  created_by uuid not null,
  created_at timestamptz not null default now()
);
alter table public.family_tree_nodes enable row level security;

create policy "أعضاء العائلة يشوفوا الشجرة" on public.family_tree_nodes for select to authenticated using (public.is_member_of(auth.uid(), family_id));
create policy "أعضاء العائلة يضيفوا في الشجرة" on public.family_tree_nodes for insert to authenticated with check (created_by = auth.uid() and public.is_member_of(auth.uid(), family_id));
create policy "أعضاء العائلة يحدثوا الشجرة" on public.family_tree_nodes for update to authenticated using (public.is_member_of(auth.uid(), family_id));
create policy "أعضاء العائلة يحذفوا من الشجرة" on public.family_tree_nodes for delete to authenticated using (public.is_member_of(auth.uid(), family_id));

-- =========================
-- 8. تصويت عائلي
-- =========================
create table if not exists public.family_decisions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by uuid not null,
  question text not null,
  options jsonb not null,
  closes_at timestamptz,
  closed boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.family_decisions enable row level security;

create policy "أعضاء العائلة يشوفوا القرارات" on public.family_decisions for select to authenticated using (public.is_member_of(auth.uid(), family_id));
create policy "أعضاء العائلة ينشئوا قرار" on public.family_decisions for insert to authenticated with check (created_by = auth.uid() and public.is_member_of(auth.uid(), family_id));
create policy "المنشئ يحدث القرار" on public.family_decisions for update to authenticated using (created_by = auth.uid());
create policy "المنشئ يحذف القرار" on public.family_decisions for delete to authenticated using (created_by = auth.uid());

create table if not exists public.decision_votes (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.family_decisions(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null,
  option_index int not null,
  created_at timestamptz not null default now(),
  unique (decision_id, user_id)
);
alter table public.decision_votes enable row level security;

create policy "أعضاء العائلة يشوفوا التصويتات" on public.decision_votes for select to authenticated using (public.is_member_of(auth.uid(), family_id));
create policy "المستخدم يصوّت" on public.decision_votes for insert to authenticated with check (user_id = auth.uid() and public.is_member_of(auth.uid(), family_id));
create policy "المستخدم يغيّر صوته" on public.decision_votes for update to authenticated using (user_id = auth.uid());
create policy "المستخدم يحذف صوته" on public.decision_votes for delete to authenticated using (user_id = auth.uid());

-- =========================
-- 9. مهام منزلية
-- =========================
create table if not exists public.household_tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by uuid not null,
  title text not null,
  assigned_to uuid,
  due_date date,
  done boolean not null default false,
  done_at timestamptz,
  done_by uuid,
  priority text not null default 'normal',
  created_at timestamptz not null default now()
);
alter table public.household_tasks enable row level security;

create policy "أعضاء العائلة يشوفوا المهام" on public.household_tasks for select to authenticated using (public.is_member_of(auth.uid(), family_id));
create policy "أعضاء العائلة ينشئوا مهمة" on public.household_tasks for insert to authenticated with check (created_by = auth.uid() and public.is_member_of(auth.uid(), family_id));
create policy "أعضاء العائلة يحدثوا المهام" on public.household_tasks for update to authenticated using (public.is_member_of(auth.uid(), family_id));
create policy "المنشئ يحذف المهمة" on public.household_tasks for delete to authenticated using (created_by = auth.uid());

-- =========================
-- 10. شارات العائلة
-- =========================
create table if not exists public.family_badges (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  badge_key text not null,
  earned_at timestamptz not null default now(),
  unique (family_id, badge_key)
);
alter table public.family_badges enable row level security;

create policy "أعضاء العائلة يشوفوا شاراتهم" on public.family_badges for select to authenticated using (public.is_member_of(auth.uid(), family_id));
create policy "أعضاء العائلة يضيفوا شارة" on public.family_badges for insert to authenticated with check (public.is_member_of(auth.uid(), family_id));

-- =========================
-- 11. صندوق ذكريات سنوي
-- =========================
create table if not exists public.yearly_memories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  year int not null,
  highlights jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  unique (family_id, year)
);
alter table public.yearly_memories enable row level security;

create policy "أعضاء العائلة يشوفوا ذكرياتهم السنوية" on public.yearly_memories for select to authenticated using (public.is_member_of(auth.uid(), family_id));
create policy "أعضاء العائلة يولّدوا ذكريات سنوية" on public.yearly_memories for insert to authenticated with check (public.is_member_of(auth.uid(), family_id));
create policy "أعضاء العائلة يحدثوا الذكريات السنوية" on public.yearly_memories for update to authenticated using (public.is_member_of(auth.uid(), family_id));

-- =========================
-- 12. تحديث RLS لجدول profiles
-- =========================
drop policy if exists "أي مستخدم مسجل يشوف ملفات عائلته" on public.profiles;

create policy "المستخدم يشوف نفسه وأعضاء عائلاته"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.family_members fm1
    join public.family_members fm2 on fm1.family_id = fm2.family_id
    where fm1.user_id = auth.uid() and fm2.user_id = profiles.id
  )
);

-- =========================
-- 13. تحديث get_user_family_id و is_family_member
-- =========================
create or replace function public.get_user_family_id(_user_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select coalesce(active_family_id, family_id) from public.profiles where id = _user_id limit 1;
$$;

create or replace function public.is_family_member(_user_id uuid, _family_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.family_members where user_id = _user_id and family_id = _family_id)
      or exists(select 1 from public.profiles where id = _user_id and family_id = _family_id);
$$;