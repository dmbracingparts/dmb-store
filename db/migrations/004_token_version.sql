-- Per-user session-invalidation counter. It is embedded in the session JWT at
-- login and checked on every authenticated request. Bumping it (on a password
-- change or reset) instantly revokes all of that user's existing sessions.
alter table staff add column if not exists token_version int not null default 0;
