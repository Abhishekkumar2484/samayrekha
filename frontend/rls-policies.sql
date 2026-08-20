-- Run once in the Supabase SQL Editor.

-- Public catalog data: readable by everyone (anon + authenticated).
alter table exams enable row level security;

create policy "exams_select_all"
on exams for select
to public
using (true);

alter table exam_events enable row level security;

create policy "exam_events_select_all"
on exam_events for select
to public
using (true);

-- User-owned data: each user can only read/write their own rows.
alter table profiles enable row level security;

create policy "profiles_select_own"
on profiles for select
to authenticated
using (auth.uid() = id);

create policy "profiles_insert_own"
on profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

alter table user_exams enable row level security;

create policy "user_exams_select_own"
on user_exams for select
to authenticated
using (auth.uid() = user_id);

create policy "user_exams_insert_own"
on user_exams for insert
to authenticated
with check (auth.uid() = user_id);

create policy "user_exams_update_own"
on user_exams for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_exams_delete_own"
on user_exams for delete
to authenticated
using (auth.uid() = user_id);
