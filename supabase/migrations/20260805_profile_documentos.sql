-- Documentos reutilizables del perfil (NIF frontal/trasero) para precargar trámites.
alter table public.profiles
  add column if not exists documentos jsonb not null default '{}'::jsonb;

comment on column public.profiles.documentos is
  'Refs a documentos del titular en storage: nif_frontal, nif_trasero';
