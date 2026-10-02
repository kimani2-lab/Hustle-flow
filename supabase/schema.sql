create extension if not exists pgcrypto;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  category text not null,
  location text not null check (char_length(location) between 1 and 120),
  pay_amount numeric(12, 2) not null check (pay_amount > 0),
  phone text not null,
  description text not null default '' check (char_length(description) <= 500),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  applicant_id uuid not null references auth.users (id) on delete cascade,
  applicant_name text not null check (char_length(applicant_name) between 1 and 80),
  applicant_email text not null,
  applicant_phone text not null check (char_length(applicant_phone) between 7 and 24),
  created_at timestamptz not null default now(),
  unique (job_id, applicant_id)
);

create index if not exists jobs_status_created_at_idx on public.jobs (status, created_at desc);
create index if not exists jobs_employer_id_idx on public.jobs (employer_id);
create index if not exists applications_job_id_idx on public.applications (job_id, created_at desc);
create index if not exists applications_applicant_id_idx on public.applications (applicant_id);

grant select on public.jobs to anon, authenticated;
grant insert, update on public.jobs to authenticated;
grant select, insert on public.applications to authenticated;

alter table public.jobs enable row level security;
alter table public.applications enable row level security;

drop policy if exists "Open jobs are visible to everyone and employers see their own" on public.jobs;
create policy "Open jobs are visible to everyone and employers see their own"
  on public.jobs for select
  using (status = 'open' or employer_id = (select auth.uid()));

drop policy if exists "Authenticated users can post jobs as themselves" on public.jobs;
create policy "Authenticated users can post jobs as themselves"
  on public.jobs for insert to authenticated
  with check (employer_id = (select auth.uid()));

drop policy if exists "Employers can update their own jobs" on public.jobs;
create policy "Employers can update their own jobs"
  on public.jobs for update to authenticated
  using (employer_id = (select auth.uid()))
  with check (employer_id = (select auth.uid()));

drop policy if exists "Applicants and job owners can read applications" on public.applications;
create policy "Applicants and job owners can read applications"
  on public.applications for select to authenticated
  using (
    applicant_id = (select auth.uid())
    or exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id
        and jobs.employer_id = (select auth.uid())
    )
  );

drop policy if exists "Workers can apply to open jobs as themselves" on public.applications;
create policy "Workers can apply to open jobs as themselves"
  on public.applications for insert to authenticated
  with check (
    applicant_id = (select auth.uid())
    and lower(applicant_email) = lower((select auth.jwt() ->> 'email'))
    and exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id
        and jobs.status = 'open'
        and jobs.employer_id <> (select auth.uid())
    )
  );