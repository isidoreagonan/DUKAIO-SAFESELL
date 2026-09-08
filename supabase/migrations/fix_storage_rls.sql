-- Correction des politiques de sécurité pour le stockage des images
DROP POLICY IF EXISTS "store_media_owner_insert" ON storage.objects;
CREATE POLICY "store_media_owner_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'store-media' AND auth.uid() = owner );

DROP POLICY IF EXISTS "store_media_owner_update" ON storage.objects;
CREATE POLICY "store_media_owner_update" ON storage.objects FOR UPDATE TO authenticated
USING ( bucket_id = 'store-media' AND auth.uid() = owner )
WITH CHECK ( bucket_id = 'store-media' AND auth.uid() = owner );

DROP POLICY IF EXISTS "store_media_owner_delete" ON storage.objects;
CREATE POLICY "store_media_owner_delete" ON storage.objects FOR DELETE TO authenticated
USING ( bucket_id = 'store-media' AND auth.uid() = owner );

DROP POLICY IF EXISTS "store_media_owner_read" ON storage.objects;
CREATE POLICY "store_media_owner_read" ON storage.objects FOR SELECT TO authenticated
USING ( bucket_id = 'store-media' AND auth.uid() = owner );

-- S'assurer que le bucket est bien configuré pour autoriser les uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('store-media', 'store-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;
