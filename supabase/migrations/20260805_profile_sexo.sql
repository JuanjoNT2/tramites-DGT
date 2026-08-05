-- Sexo del titular (sincronizado desde trámites / Mis datos)
alter table public.profiles
  add column if not exists sexo text;

alter table public.profiles
  drop constraint if exists profiles_sexo_check;

alter table public.profiles
  add constraint profiles_sexo_check
  check (sexo is null or sexo in ('HOMBRE', 'MUJER'));
