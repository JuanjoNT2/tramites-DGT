-- Auth profiles + solicitudes (gestores)
-- Ejecutar en Supabase SQL editor o vía CLI contra el proyecto gawfttwqyejunscftman.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user', 'gestor', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_email_idx on public.profiles (email);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name, ''), profiles.full_name),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();

alter table public.profiles enable row level security;

-- Lectura/escritura de perfiles solo desde el servidor (service role).
-- Sin policies públicas: el cliente anon no lee ni modifica roles.

create table if not exists public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  payload jsonb not null default '{}'::jsonb,
  user_id uuid references auth.users (id) on delete set null,
  email text,
  status text not null default 'nueva',
  created_at timestamptz not null default now()
);

create index if not exists solicitudes_tipo_idx on public.solicitudes (tipo);
create index if not exists solicitudes_created_at_idx on public.solicitudes (created_at desc);
create index if not exists solicitudes_user_id_idx on public.solicitudes (user_id);
create index if not exists solicitudes_status_idx on public.solicitudes (status);

alter table public.solicitudes enable row level security;
-- Escritura/lectura vía service role en el servidor SvelteKit.
