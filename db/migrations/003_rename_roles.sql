-- Rename staff roles: owner -> administrator, staff -> inputer (viewer unchanged).
-- Idempotent and safe on both fresh installs (002 already uses the new names)
-- and existing databases still holding the old role values.
-- Drop the old constraint FIRST so the rename UPDATEs aren't rejected by it.
alter table staff drop constraint if exists staff_role_check;
update staff set role = 'administrator' where role = 'owner';
update staff set role = 'inputer' where role = 'staff';
alter table staff add constraint staff_role_check check (role in ('administrator', 'inputer', 'viewer'));
alter table staff alter column role set default 'inputer';
