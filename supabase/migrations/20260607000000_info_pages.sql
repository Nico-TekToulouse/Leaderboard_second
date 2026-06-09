create table info_pages (
  id         uuid        primary key default gen_random_uuid(),
  title      text        not null,
  content    text        not null default '',
  created_at timestamptz not null default now()
);

-- Lecture publique
grant select on info_pages to anon, authenticated;

-- Écriture admin
grant insert, update, delete on info_pages to authenticated;
grant all on info_pages to service_role;
