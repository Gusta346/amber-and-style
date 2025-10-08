-- Create student_enrollments table to mark emails as 'Aluno'
create table if not exists public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.student_enrollments enable row level security;

-- Allow the owner (by email in JWT) to read their own enrollment row
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='student_enrollments' and policyname='student_enrollments_select_self'
  ) then
    execute $policy$
      create policy student_enrollments_select_self on public.student_enrollments
        for select using (
          coalesce(auth.jwt() ->> 'email','') <> '' and lower(email) = lower(coalesce(auth.jwt() ->> 'email',''))
        );
    $policy$;
  end if;
end$$;

-- Admins can insert/delete (admin via admins table or whitelisted email)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='student_enrollments' and policyname='student_enrollments_admin_insert'
  ) then
    execute $policy$
      create policy student_enrollments_admin_insert on public.student_enrollments
        for insert with check (
          (exists(select 1 from public.admins a where a.user_id = auth.uid()))
          or lower(coalesce(auth.jwt() ->> 'email','')) = lower('gustavoribeiro4523@gmail.com')
        );
    $policy$;
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='student_enrollments' and policyname='student_enrollments_admin_delete'
  ) then
    execute $policy$
      create policy student_enrollments_admin_delete on public.student_enrollments
        for delete using (
          (exists(select 1 from public.admins a where a.user_id = auth.uid()))
          or lower(coalesce(auth.jwt() ->> 'email','')) = lower('gustavoribeiro4523@gmail.com')
        );
    $policy$;
  end if;
end$$;

-- Optional: read for admins
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='student_enrollments' and policyname='student_enrollments_admin_select'
  ) then
    execute $policy$
      create policy student_enrollments_admin_select on public.student_enrollments
        for select using (
          (exists(select 1 from public.admins a where a.user_id = auth.uid()))
          or lower(coalesce(auth.jwt() ->> 'email','')) = lower('gustavoribeiro4523@gmail.com')
        );
    $policy$;
  end if;
end$$;
