-- Panel usuario: perfiles extendidos, estados, vehículos, documentos, notificaciones
-- Ejecutar en SQL Editor del proyecto gawfttwqyejunscftman.

-- Profiles extendidos
alter table public.profiles
  add column if not exists telefono text,
  add column if not exists nif text,
  add column if not exists direccion jsonb not null default '{}'::jsonb;

-- Solicitudes: estados + updated_at
alter table public.solicitudes
  add column if not exists updated_at timestamptz not null default now();

-- Normalizar status existentes y aplicar check
update public.solicitudes
set status = 'nueva'
where status is null or status = '' or status not in ('nueva', 'en_curso', 'realizada', 'cancelada');

alter table public.solicitudes drop constraint if exists solicitudes_status_check;
alter table public.solicitudes
  add constraint solicitudes_status_check
  check (status in ('nueva', 'en_curso', 'realizada', 'cancelada'));

create or replace function public.set_solicitudes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists solicitudes_set_updated_at on public.solicitudes;
create trigger solicitudes_set_updated_at
  before update on public.solicitudes
  for each row execute function public.set_solicitudes_updated_at();

create index if not exists solicitudes_user_status_created_idx
  on public.solicitudes (user_id, status, created_at desc);

-- Vehículos del usuario
create table if not exists public.vehiculos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  matricula text not null,
  tipo text not null default 'coche',
  marca text,
  modelo text,
  bastidor text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, matricula)
);

create index if not exists vehiculos_user_id_idx on public.vehiculos (user_id);

create or replace function public.set_vehiculos_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vehiculos_set_updated_at on public.vehiculos;
create trigger vehiculos_set_updated_at
  before update on public.vehiculos
  for each row execute function public.set_vehiculos_updated_at();

alter table public.vehiculos enable row level security;

-- Documentos de solicitud
create table if not exists public.solicitud_documentos (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  nombre text not null,
  path text not null,
  mime text,
  uploaded_by text not null check (uploaded_by in ('user', 'gestor', 'admin')),
  created_at timestamptz not null default now()
);

create index if not exists solicitud_documentos_solicitud_idx
  on public.solicitud_documentos (solicitud_id);
create index if not exists solicitud_documentos_user_idx
  on public.solicitud_documentos (user_id);

alter table public.solicitud_documentos enable row level security;

-- Notificaciones in-app
create table if not exists public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null default 'info',
  titulo text not null,
  cuerpo text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notificaciones_user_created_idx
  on public.notificaciones (user_id, created_at desc);
create index if not exists notificaciones_user_unread_idx
  on public.notificaciones (user_id)
  where read_at is null;

alter table public.notificaciones enable row level security;

-- Bucket privado para documentos (idempotente)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tramite-docs',
  'tramite-docs',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;
