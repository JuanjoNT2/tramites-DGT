-- Secuencia anual de facturas (TDO-YYYY-NNNNN). Solo service_role.
create or replace function public.next_factura_seq(p_year integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  k text := 'factura_seq_' || p_year::text;
  n integer;
begin
  insert into public.site_settings as s (key, value, updated_at)
  values (k, jsonb_build_object('seq', 1), now())
  on conflict (key) do update
    set value = jsonb_build_object(
          'seq',
          coalesce((s.value->>'seq')::integer, 0) + 1
        ),
        updated_at = now()
  returning (s.value->>'seq')::integer into n;
  return n;
end;
$$;

revoke all on function public.next_factura_seq(integer) from public;
revoke all on function public.next_factura_seq(integer) from anon;
revoke all on function public.next_factura_seq(integer) from authenticated;
grant execute on function public.next_factura_seq(integer) to service_role;
