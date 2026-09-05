create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'Attending Cardiologist',
  hospital_name text,
  department text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patients (
  patient_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  dob text,
  gender text not null,
  age integer not null,
  mrn text,
  clinical_features jsonb not null default '{}'::jsonb,
  notes text,
  last_prediction_date timestamptz,
  last_risk_score double precision,
  last_risk_level text check (last_risk_level in ('LOW','MEDIUM','HIGH')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.predictions (
  prediction_id text primary key,
  patient_id text not null references public.patients(patient_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  prediction_date timestamptz not null default now(),
  readmission_probability double precision not null check (readmission_probability between 0 and 100),
  risk_level text not null check (risk_level in ('LOW','MEDIUM','HIGH')),
  model_prediction text not null check (model_prediction in ('Likely Readmission','Unlikely Readmission')),
  shap_explanation jsonb not null default '[]'::jsonb,
  gemini_interpretation jsonb,
  shap_status text not null default 'success',
  gemini_status text not null default 'unavailable',
  clinical_features jsonb,
  clinician_name text
);

create index if not exists patients_user_id_idx on public.patients(user_id);
create index if not exists predictions_user_id_idx on public.predictions(user_id);
create index if not exists predictions_patient_id_idx on public.predictions(patient_id);
create index if not exists predictions_date_idx on public.predictions(prediction_date desc);

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.predictions enable row level security;

drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "patients_self" on public.patients;
create policy "patients_self" on public.patients
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "predictions_self" on public.predictions;
create policy "predictions_self" on public.predictions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.patients to authenticated;
grant select, insert, update, delete on public.predictions to authenticated;
