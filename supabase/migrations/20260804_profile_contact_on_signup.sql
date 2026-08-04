-- Copiar teléfono y NIF del metadata de Auth al crear el perfil.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, telefono, nif, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'telefono', '')), ''),
    nullif(upper(trim(coalesce(new.raw_user_meta_data->>'nif', ''))), ''),
    'user'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name, ''), profiles.full_name),
        telefono = coalesce(excluded.telefono, profiles.telefono),
        nif = coalesce(excluded.nif, profiles.nif),
        updated_at = now();
  return new;
end;
$$;
