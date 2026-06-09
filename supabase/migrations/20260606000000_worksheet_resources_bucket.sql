-- Bucket public pour les fichiers ressources des sections de worksheet
insert into storage.buckets (id, name, public)
values ('worksheet-resources', 'worksheet-resources', true)
on conflict (id) do nothing;

-- Lecture publique (stagiaires téléchargent sans auth)
create policy "worksheet_resources_public_read"
  on storage.objects for select
  using (bucket_id = 'worksheet-resources');

-- Écriture via service_role uniquement (route admin côté serveur)
create policy "worksheet_resources_service_write"
  on storage.objects for insert
  with check (bucket_id = 'worksheet-resources');

create policy "worksheet_resources_service_delete"
  on storage.objects for delete
  using (bucket_id = 'worksheet-resources');
