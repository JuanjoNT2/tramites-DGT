-- Fecha de nacimiento en el perfil (sincronizada desde trámites / Mis datos)
alter table public.profiles
  add column if not exists fecha_nacimiento date;
