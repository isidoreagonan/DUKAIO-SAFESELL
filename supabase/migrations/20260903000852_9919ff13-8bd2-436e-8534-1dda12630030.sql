CREATE POLICY "Vendeurs lisent leurs medias"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'store-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Vendeurs envoient leurs medias"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'store-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Vendeurs modifient leurs medias"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'store-media' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'store-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Vendeurs suppriment leurs medias"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'store-media' AND (storage.foldername(name))[1] = auth.uid()::text);