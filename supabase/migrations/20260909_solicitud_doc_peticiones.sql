-- Peticiones de documentos (pendiente / rechazado DGT) + metadatos en archivos.
-- Ejecutar en SQL Editor del proyecto si no se aplica por CLI.

alter table public.solicitud_documentos
  add column if not exists doc_type text,
  add column if not exists status text not null default 'recibido',
  add column if not exists rejection_reason text,
  add column if not exists meta jsonb;

alter table public.solicitud_documentos drop constraint if exists solicitud_documentos_status_check;
alter table public.solicitud_documentos
  add constraint solicitud_documentos_status_check
  check (status in ('recibido', 'rechazado'));

create index if not exists solicitud_documentos_solicitud_type_idx
  on public.solicitud_documentos (solicitud_id, doc_type);

create table if not exists public.solicitud_doc_peticiones (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  kind text not null check (kind in ('pendiente', 'rechazado')),
  doc_type text not null,
  doc_label text not null,
  motivo text,
  documento_id uuid references public.solicitud_documentos (id) on delete set null,
  status text not null default 'abierta' check (status in ('abierta', 'resuelta', 'cancelada')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists solicitud_doc_peticiones_solicitud_idx
  on public.solicitud_doc_peticiones (solicitud_id, status);

create unique index if not exists solicitud_doc_peticiones_abierta_slot_idx
  on public.solicitud_doc_peticiones (solicitud_id, doc_type)
  where status = 'abierta';

alter table public.solicitud_doc_peticiones enable row level security;
