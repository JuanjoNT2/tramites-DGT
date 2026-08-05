-- Nombre y apellidos separados (alineado con formularios de trámites).
-- full_name se mantiene como concatenación para display / compat.

alter table public.profiles
  add column if not exists nombre text,
  add column if not exists apellido1 text,
  add column if not exists apellido2 text;

comment on column public.profiles.nombre is 'Nombre de pila';
comment on column public.profiles.apellido1 is 'Primer apellido';
comment on column public.profiles.apellido2 is 'Segundo apellido';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre text := nullif(trim(coalesce(new.raw_user_meta_data->>'nombre', '')), '');
  v_apellido1 text := nullif(trim(coalesce(new.raw_user_meta_data->>'apellido1', '')), '');
  v_apellido2 text := nullif(trim(coalesce(new.raw_user_meta_data->>'apellido2', '')), '');
  v_full text := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');
begin
  if v_full is null then
    v_full := nullif(
      trim(concat_ws(' ', v_nombre, v_apellido1, v_apellido2)),
      ''
    );
  end if;

  insert into public.profiles (
    id, email, full_name, nombre, apellido1, apellido2, telefono, nif, role
  )
  values (
    new.id,
    new.email,
    coalesce(v_full, ''),
    v_nombre,
    v_apellido1,
    v_apellido2,
    nullif(trim(coalesce(new.raw_user_meta_data->>'telefono', '')), ''),
    nullif(upper(trim(coalesce(new.raw_user_meta_data->>'nif', ''))), ''),
    'user'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name, ''), profiles.full_name),
        nombre = coalesce(excluded.nombre, profiles.nombre),
        apellido1 = coalesce(excluded.apellido1, profiles.apellido1),
        apellido2 = coalesce(excluded.apellido2, profiles.apellido2),
        telefono = coalesce(excluded.telefono, profiles.telefono),
        nif = coalesce(excluded.nif, profiles.nif),
        updated_at = now();
  return new;
end;
$$;
