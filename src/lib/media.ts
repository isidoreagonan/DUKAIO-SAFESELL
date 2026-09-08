import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type MediaAsset = Tables<"media_library">;

const BUCKET = "store-media";
/** Les URLs signées sont valables 10 ans : le vendeur garde ses visuels. */
const SIGNED_TTL = 60 * 60 * 24 * 365 * 10;

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Session expirée");
  return data.user.id;
}

/** Bibliothèque média du vendeur connecté (RLS : uniquement ses fichiers). */
export function useMedia() {
  return useQuery({
    queryKey: ["media"],
    queryFn: async (): Promise<MediaAsset[]> => {
      const userId = await currentUserId();
      const { data, error } = await supabase
        .from("media_library")
        .select("*")
        .eq("user_id", userId)
        .order("added_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
/** Formats que l'IA d'images n'accepte pas : on les reconvertit en JPEG. */
const NEEDS_CONVERT = ["image/avif", "image/gif"];

/**
 * Convertit AVIF/GIF en JPEG dans le navigateur. Indispensable : ces formats
 * sont refusés comme photo de référence par le générateur d'images, ce qui
 * faisait inventer un produit différent du vôtre.
 */
async function toReferenceSafeBlob(blob: Blob, name: string): Promise<Blob> {
  if (!NEEDS_CONVERT.includes(blob.type)) return blob;
  const url = URL.createObjectURL(blob);
  try {
    const converted = await cropToBlob(url, { x: 0, y: 0, width: 0, height: 0 }, "image/jpeg");
    return converted;
  } catch {
    throw new Error(`Impossible de convertir « ${name} ». Réessayez en JPG ou PNG.`);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { blob: Blob; name: string }): Promise<MediaAsset> => {
      const name = input.name;
      if (!ALLOWED.includes(input.blob.type))
        throw new Error("Format non autorisé (JPG, PNG, WEBP, AVIF ou GIF)");
      if (input.blob.size > MAX_BYTES) throw new Error("Image trop lourde (8 Mo maximum)");
      const blob = await toReferenceSafeBlob(input.blob, name);
      const userId = await currentUserId();

      const ext = blob.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
        cacheControl: "31536000",
        contentType: blob.type,
        upsert: false,
      });
      if (error) throw error;
      const { data: signed, error: signError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_TTL);
      if (signError || !signed) throw signError ?? new Error("URL introuvable");
      const { data: row, error: insertError } = await supabase
        .from("media_library")
        .insert({
          user_id: userId,
          url: signed.signedUrl,
          name: name.slice(0, 120),
          type: blob.type,
          size_bytes: blob.size,
          storage_path: path,
        })
        .select("*")
        .single();
      if (insertError) throw insertError;
      return row;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["media"] }),
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (asset: MediaAsset) => {
      const userId = await currentUserId();
      if (asset.storage_path) await supabase.storage.from(BUCKET).remove([asset.storage_path]);
      const { error } = await supabase
        .from("media_library")
        .delete()
        .eq("id", asset.id)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["media"] }),
  });
}

export type CropArea = { x: number; y: number; width: number; height: number };

/** Recadre une image locale côté navigateur avant l'envoi. */
export async function cropToBlob(src: string, area: CropArea, type = "image/jpeg"): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image illisible"));
    img.src = src;
  });
  const box =
    area.width > 0 && area.height > 0
      ? area
      : { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(box.width));
  canvas.height = Math.max(1, Math.round(box.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Recadrage indisponible");
  ctx.drawImage(image, box.x, box.y, box.width, box.height, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, type === "image/jpeg" ? 0.92 : undefined),
  );
  if (!blob) throw new Error("Recadrage impossible");
  return blob;
}
