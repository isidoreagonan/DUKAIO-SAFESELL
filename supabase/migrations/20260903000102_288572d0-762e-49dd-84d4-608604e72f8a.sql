create policy "store_media_owner_read" on storage.objects for select to authenticated
  using (bucket_id = 'store-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "store_media_owner_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'store-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "store_media_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'store-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'store-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "store_media_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'store-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "store_media_public_read" on storage.objects for select to anon
  using (bucket_id = 'store-media');