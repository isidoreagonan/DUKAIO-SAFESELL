import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { AlertTriangle, Check, Crop, ImageIcon, Link2, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cropToBlob, useDeleteMedia, useMedia, useUploadMedia } from "@/lib/media";
import { VIDEO_HELP, parseVideoUrl } from "@/lib/video";
import { cn } from "@/lib/utils";

const RATIOS = [
  { label: "Libre", value: 0 },
  { label: "1:1", value: 1 },
  { label: "4:5", value: 4 / 5 },
  { label: "3:2", value: 3 / 2 },
  { label: "16:9", value: 16 / 9 },
] as const;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

/**
 * Bibliothèque média du vendeur : import d'images avec recadrage, réutilisation
 * des visuels déjà envoyés et suppression. Les fichiers vidéo sont totalement
 * bloqués : un message explique qu'il faut coller un lien vidéo (aperçu intégré).
 */
export function MediaLibraryDialog({
  open,
  onOpenChange,
  onSelect,
  onSelectVideo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  /** Fourni = onglet « Lien vidéo » disponible. */
  onSelectVideo?: (url: string) => void;
}) {
  const { data: assets, isLoading } = useMedia();
  const upload = useUploadMedia();
  const remove = useDeleteMedia();
  const inputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"images" | "video">("images");
  const [videoInput, setVideoInput] = useState("");
  const [videoBlocked, setVideoBlocked] = useState(false);
  const [source, setSource] = useState<{ url: string; name: string; type: string } | null>(null);
  const [ratio, setRatio] = useState<number>(0);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [area, setArea] = useState<Area | null>(null);

  useEffect(() => {
    if (!open) {
      setSource(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setArea(null);
      setTab("images");
      setVideoInput("");
      setVideoBlocked(false);
    }
  }, [open]);

  const parsedVideo = parseVideoUrl(videoInput);

  const rejectVideo = () => {
    setVideoBlocked(true);
    toast.error("Fichier vidéo refusé", { description: VIDEO_HELP });
  };

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (file.type.startsWith("video/") || /\.(mp4|mov|avi|mkv|webm|m4v|wmv|flv|3gp)$/i.test(file.name)) {
      rejectVideo();
      return;
    }
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Choisissez une image (JPG, PNG, WEBP, AVIF ou GIF)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setSource({ url: String(reader.result), name: file.name, type: file.type });
    reader.readAsDataURL(file);
  };

  const confirm = async () => {
    if (!source) return;
    try {
      const type = source.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = area
        ? await cropToBlob(source.url, area, type)
        : await cropToBlob(source.url, { x: 0, y: 0, width: 0, height: 0 }, type);
      const asset = await upload.mutateAsync({ blob, name: source.name });
      onSelect(asset.url);
      toast.success("Image ajoutée à votre bibliothèque");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import impossible");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl rounded-[6px]"
        onDrop={(e) => {
          const file = e.dataTransfer.files?.[0];
          if (file) {
            e.preventDefault();
            pick(file);
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Bibliothèque média</DialogTitle>
          <DialogDescription>
            Importez, recadrez et réutilisez vos visuels. Images uniquement — les vidéos passent par
            un lien.
          </DialogDescription>
        </DialogHeader>

        {onSelectVideo && !source && (
          <div className="flex gap-1 rounded-[6px] border border-border p-1">
            {(
              [
                { key: "images", label: "Images", icon: ImageIcon },
                { key: "video", label: "Lien vidéo", icon: Link2 },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-semibold transition",
                  tab === t.key ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                )}
              >
                <t.icon size={13} /> {t.label}
              </button>
            ))}
          </div>
        )}

        {onSelectVideo && tab === "video" && !source ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-[6px] border border-border bg-surface-tint p-3 text-xs text-muted-foreground">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-primary" />
              <p>{VIDEO_HELP}</p>
            </div>
            <input
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              className="h-11 w-full rounded-[6px] border border-border bg-muted/30 px-3.5 text-sm outline-none focus:border-primary/50 focus:bg-background"
            />
            {videoInput && !parsedVideo && (
              <p className="text-xs font-medium text-destructive">
                Lien non reconnu. Utilisez YouTube, Vimeo ou Dailymotion.
              </p>
            )}
            {parsedVideo && (
              <div className="overflow-hidden rounded-[6px] border border-border">
                <iframe
                  src={parsedVideo.embedUrl}
                  title="Aperçu vidéo"
                  allowFullScreen
                  className="aspect-video w-full"
                />
              </div>
            )}
            <DialogFooter>
              <button
                type="button"
                disabled={!parsedVideo}
                onClick={() => {
                  if (!parsedVideo) return;
                  onSelectVideo(parsedVideo.url);
                  toast.success(`Vidéo ${parsedVideo.provider} liée`);
                  onOpenChange(false);
                }}
                className="btn-3d rounded-[6px] px-3 py-2 text-sm font-semibold disabled:opacity-60"
              >
                Utiliser ce lien
              </button>
            </DialogFooter>
          </div>
        ) : source ? (
          <div className="space-y-3">
            <div className="relative h-64 overflow-hidden rounded-[6px] bg-muted">
              <Cropper
                image={source.url}
                crop={crop}
                zoom={zoom}
                {...(ratio ? { aspect: ratio } : {})}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setArea(pixels)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {RATIOS.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => setRatio(r.value)}
                  className={cn(
                    "rounded-[4px] border border-border px-2.5 py-1 text-xs font-medium transition hover:bg-accent",
                    ratio === r.value && "border-primary bg-primary/10 text-primary",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Zoom
              </p>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.01}
                onValueChange={(v: number[]) => setZoom(v[0] ?? 1)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSource(null)}
                className="rounded-[6px] border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void confirm()}
                disabled={upload.isPending}
                className="btn-3d flex items-center gap-1.5 rounded-[6px] px-3 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {upload.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Crop size={14} />
                )}
                Recadrer et utiliser
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-[6px] border border-dashed border-border py-6 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-foreground"
            >
              <Upload size={15} /> Importer une image (JPG, PNG, WEBP · 8 Mo max)
            </button>
            <input
              ref={inputRef}
              type="file"
              accept={IMAGE_TYPES.join(",")}
              className="hidden"
              onChange={(e) => {
                pick(e.target.files?.[0]);
                e.target.value = "";
              }}
            />

            {videoBlocked && (
              <div className="flex items-start gap-2 rounded-[6px] border border-destructive/40 bg-destructive/5 p-3 text-xs text-foreground">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-destructive" />
                <p>
                  {VIDEO_HELP}
                  {onSelectVideo && (
                    <button
                      type="button"
                      onClick={() => setTab("video")}
                      className="ml-1 font-semibold text-primary underline"
                    >
                      Ajouter un lien vidéo
                    </button>
                  )}
                </p>
              </div>
            )}

            {isLoading ? (
              <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" /> Chargement de vos visuels…
              </p>
            ) : (assets ?? []).length === 0 ? (
              <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <ImageIcon size={14} /> Aucun visuel pour le moment.
              </p>
            ) : (
              <div className="grid max-h-[46vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                {(assets ?? []).map((asset) => (
                  <div
                    key={asset.id}
                    className="group relative overflow-hidden rounded-[6px] border border-border"
                  >
                    <img
                      src={asset.url}
                      alt={asset.name ?? ""}
                      loading="lazy"
                      className="aspect-square w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-background/85 p-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(asset.url);
                          onOpenChange(false);
                        }}
                        className="flex flex-1 items-center justify-center gap-1 rounded-[4px] bg-primary py-1 text-[11px] font-semibold text-primary-foreground"
                      >
                        <Check size={11} /> Utiliser
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove.mutateAsync(asset)}
                        aria-label="Supprimer le visuel"
                        className="rounded-[4px] px-1.5 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
