-- Run once in the Supabase SQL Editor, after rls-policies.sql.
-- Adds the scraper staging table and switches profiles to store a full
-- Web Push subscription instead of a bare token.

create table scraped_events (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  raw_label text not null,
  raw_value text not null,
  title text not null,
  inferred_organization text,
  inferred_category text,
  event_type text,
  parsed_date date,
  status text not null default 'pending',
  promoted_exam_id uuid references exams(id),
  promoted_event_id uuid references exam_events(id),
  scraped_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (source_url, raw_label)
);

-- No RLS policies on purpose: only the service-role (admin) client, used by
-- the cron/scraper and the admin review actions, may read or write this
-- table. Anon and authenticated requests are denied entirely.
alter table scraped_events enable row level security;

alter table profiles drop column if exists push_token;
alter table profiles add column if not exists push_subscription jsonb;
