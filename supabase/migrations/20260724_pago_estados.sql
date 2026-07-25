-- Estados de pago en solicitudes (Redsys).
-- Ejecutar en SQL Editor tras 20260724_panel_usuario.sql

update public.solicitudes
set status = 'nueva'
where status is null or status = ''
  or status not in ('nueva', 'en_curso', 'realizada', 'cancelada', 'pendiente_pago', 'pagada');

alter table public.solicitudes drop constraint if exists solicitudes_status_check;
alter table public.solicitudes
  add constraint solicitudes_status_check
  check (status in ('nueva', 'en_curso', 'realizada', 'cancelada', 'pendiente_pago', 'pagada'));
