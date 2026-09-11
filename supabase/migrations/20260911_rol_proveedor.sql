-- Rol 'proveedor': acceso exclusivo al panel del proveedor externo de distintivos
-- ambientales (Ideauto). No es staff: no entra en /gestor ni en /admin.
alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'gestor', 'admin', 'proveedor'));
