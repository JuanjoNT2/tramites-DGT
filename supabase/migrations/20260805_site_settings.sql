-- Ajustes globales editables desde el panel admin (p. ej. email de notificaciones).
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.site_settings is 'Configuración de sitio (clave/valor). Solo acceso vía service role.';

alter table public.site_settings enable row level security;

-- Sin políticas públicas: solo service_role / backend.

insert into public.site_settings (key, value)
values (
  'admin_notify_email',
  '{"email":"juanjo.navarro@performanze.com"}'::jsonb
)
on conflict (key) do nothing;
