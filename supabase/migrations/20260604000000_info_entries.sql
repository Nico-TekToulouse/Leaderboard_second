create table info_entries (
  id         uuid        primary key default gen_random_uuid(),
  category   text        not null check (category in ('rules', 'sanctions', 'discord')),
  title      text        not null,
  content    text        not null default '',
  url        text,
  "order"    integer     not null default 0,
  created_at timestamptz not null default now()
);

-- Lecture publique
grant select on info_entries to anon, authenticated;

-- Écriture admin
grant insert, update, delete on info_entries to authenticated;
grant all on info_entries to service_role;
