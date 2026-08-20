-- Sample data for testing SamayRekha's Discovery screen.
-- Paste into Supabase SQL Editor and run once.

with
  ssc as (
    insert into exams (name, organization, category, official_url)
    values ('SSC CGL 2026', 'Staff Selection Commission', 'SSC', 'https://ssc.nic.in')
    returning id
  ),
  banking as (
    insert into exams (name, organization, category, official_url)
    values ('IBPS PO 2026', 'Institute of Banking Personnel Selection', 'Banking', 'https://ibps.in')
    returning id
  ),
  railway as (
    insert into exams (name, organization, category, official_url)
    values ('RRB NTPC 2026', 'Railway Recruitment Board', 'Railway', 'https://rrbcdg.gov.in')
    returning id
  ),
  state_psc as (
    insert into exams (name, organization, category, official_url)
    values ('UPPSC PCS 2026', 'Uttar Pradesh Public Service Commission', 'State PSC', 'https://uppsc.up.nic.in')
    returning id
  ),
  police as (
    insert into exams (name, organization, category, official_url)
    values ('Delhi Police Constable 2026', 'Delhi Police', 'Police', 'https://delhipolice.gov.in')
    returning id
  )
insert into exam_events (exam_id, event_type, event_date, status, official_source_url, last_verified_at)
select id, 'application_end', current_date, 'upcoming', 'https://ssc.nic.in', now() from ssc
union all
select id, 'exam_date', current_date + interval '45 days', 'upcoming', 'https://ssc.nic.in', now() from ssc
union all
select id, 'admit_card', current_date + interval '3 days', 'upcoming', 'https://ibps.in', now() from banking
union all
select id, 'exam_date', current_date + interval '20 days', 'upcoming', 'https://ibps.in', now() from banking
union all
select id, 'application_start', current_date - interval '10 days', 'upcoming', 'https://rrbcdg.gov.in', now() from railway
union all
select id, 'application_end', current_date + interval '2 days', 'upcoming', 'https://rrbcdg.gov.in', now() from railway
union all
select id, 'result', current_date + interval '60 days', 'upcoming', 'https://uppsc.up.nic.in', now() from state_psc
union all
select id, 'notification', current_date + interval '90 days', 'upcoming', 'https://delhipolice.gov.in', now() from police
union all
select id, 'application_end', current_date + interval '6 days', 'upcoming', 'https://delhipolice.gov.in', now() from police;
