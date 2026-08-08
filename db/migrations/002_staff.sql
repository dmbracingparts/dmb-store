create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  job text,
  email text unique not null,
  role text not null default 'staff' check (role in ('owner', 'staff', 'viewer')),
  password_hash text not null,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists staff_email_idx on staff (email);
