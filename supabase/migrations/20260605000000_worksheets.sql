create table worksheets (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  description text,
  is_active   boolean     not null default false,
  sections    jsonb       not null default '[]',
  created_at  timestamptz not null default now()
);

create table worksheet_responses (
  id                   uuid        primary key default gen_random_uuid(),
  worksheet_id         uuid        not null references worksheets(id) on delete cascade,
  faction_id           uuid        not null references factions(id)   on delete cascade,
  respondent_firstname text        not null,
  respondent_lastname  text        not null,
  answers              jsonb       not null default '{}',
  submitted_at         timestamptz not null default now()
);

create index idx_worksheet_responses_worksheet_id on worksheet_responses (worksheet_id);
create index idx_worksheet_responses_faction_id   on worksheet_responses (faction_id);

-- Garantit un seul worksheet actif à la fois
create unique index idx_worksheets_one_active
  on worksheets (is_active)
  where is_active = true;

grant select on worksheets to anon, authenticated;
grant insert, update, delete on worksheets to authenticated;
grant all on worksheets to service_role;

grant select on worksheet_responses to authenticated;
grant insert on worksheet_responses to anon, authenticated;
grant all on worksheet_responses to service_role;
