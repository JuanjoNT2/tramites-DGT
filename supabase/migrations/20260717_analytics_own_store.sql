-- Analytics propias (informe Performanze · capas ALM + MOD + carril B)
-- Ejecutar en Supabase SQL editor o vía CLI.

create table if not exists public.analytics_events (
  id uuid primary key,
  event_name text not null,
  visitor_id text not null,
  session_id text not null,
  consent text not null check (consent in ('granted', 'denied')),
  ts timestamptz not null,
  received_at timestamptz not null default now(),
  channel text not null default 'Direct',
  is_conversion boolean not null default false,
  props jsonb not null default '{}'::jsonb,
  acquisition jsonb not null default '{}'::jsonb
);

create index if not exists analytics_events_ts_idx on public.analytics_events (ts);
create index if not exists analytics_events_session_idx on public.analytics_events (session_id);
create index if not exists analytics_events_visitor_idx on public.analytics_events (visitor_id);
create index if not exists analytics_events_channel_idx on public.analytics_events (channel);

alter table public.analytics_events enable row level security;
-- Solo service role escribe/lee desde el servidor; sin policies públicas.

create table if not exists public.analytics_daily (
  day date not null,
  channel text not null,
  page_type text not null,
  event_name text not null,
  event_count bigint not null default 0,
  users bigint not null default 0,
  sessions bigint not null default 0,
  conversions bigint not null default 0,
  primary key (day, channel, page_type, event_name)
);

alter table public.analytics_daily enable row level security;

create table if not exists public.analytics_external_daily (
  source text not null check (source in ('search_console', 'google_ads', 'meta_ads')),
  day date not null,
  channel text not null,
  metrics jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (source, day, channel)
);

alter table public.analytics_external_daily enable row level security;
