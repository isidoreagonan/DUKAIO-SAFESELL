import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bot, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin/shell";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  COUNTRIES,
  PLATFORMS,
  countryLabel,
  platformLabel,
  useAddTrendingAd,
  useRemoveTrendingAd,
  useRunAdScout,
  useTrendingAds,
} from "@/lib/ad-library";

export const Route = createFileRoute("/_authenticated/admin/tendances")({
  head: () => ({
    meta: [
      { title: "Radar publicitaire — administration Dukaio" },
      { name: "description", content: "Gestion des publicités en tendance de Dukaio." },
      { property: "og:title", content: "Radar publicitaire — administration Dukaio" },
      { property: "og:description", content: "Gestion des publicités en tendance de Dukaio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminTrends,
});

const EMPTY = {
  title: "",
  description: "",
  platform: "meta",
  country: "BF",
  category: CATEGORIES[0] as string,
  why_it_sells: "",
  likes: 0,
  source_url: "",
  video_url: "",
  thumbnail_url: "",
  gender: "tous",
  sales_model: "cod",
};

const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary";

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1.5", wide && "sm:col-span-2")}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function AdminTrends() {
  const { data: ads } = useTrendingAds();
  const add = useAddTrendingAd();
  const remove = useRemoveTrendingAd();
  const scout = useRunAdScout();
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);

  const rows = ads ?? [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    add.mutate(
      {
        ...form,
        likes: Number(form.likes) || 0,
        source_url: form.source_url || null,
        video_url: form.video_url || null,
        thumbnail_url: form.thumbnail_url || null,
      },
      {
        onSuccess: () => {
          toast.success("Publicité ajoutée");
          setForm(EMPTY);
          setOpen(false);
        },
        onError: (err) => toast.error((err as Error).message),
      },
    );
  }

  function launch() {
    scout.mutate(undefined, {
      onSuccess: (res) => {
        if (!res.ok && res.reason === "token_manquant") {
          toast.error("Le jeton Meta n'est pas encore configuré.");
          return;
        }
        toast.success(`${res.inserted} ajoutées, ${res.updated} mises à jour`);
      },
      onError: (err) => toast.error((err as Error).message),
    });
  }

  return (
    <AdminShell
      title="Radar publicitaire"
      subtitle={`${rows.length} publicité${rows.length > 1 ? "s" : ""} publiée${rows.length > 1 ? "s" : ""}`}
      actions={
        <Button onClick={() => setOpen((v) => !v)} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Ajouter
        </Button>
      }
    >

      <section className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-bold">
            <Bot className="h-4 w-4 shrink-0" /> Robot de collecte
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Récupère automatiquement les publicités actives depuis la bibliothèque publicitaire Meta.
          </p>
        </div>
        <Button onClick={launch} disabled={scout.isPending} className="shrink-0">
          {scout.isPending ? "Collecte en cours…" : "Lancer la collecte"}
        </Button>
      </section>

      {open ? (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 font-bold">
            <Plus className="h-4 w-4" /> Nouvelle publicité
          </h2>
          <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Titre du produit" wide>
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Sérum de pousse cils & sourcils"
              />
            </Field>
            <Field label="Nombre de J'aime">
              <input
                type="number"
                className={inputClass}
                value={form.likes}
                onChange={(e) => setForm({ ...form, likes: Number(e.target.value) })}
              />
            </Field>
            <Field label="Plateforme">
              <select
                className={inputClass}
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Pays">
              <select
                className={inputClass}
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Catégorie">
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Genre visé">
              <select
                className={inputClass}
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="tous">Mixte</option>
                <option value="femme">Femmes</option>
                <option value="homme">Hommes</option>
              </select>
            </Field>
            <Field label="Modèle de vente">
              <select
                className={inputClass}
                value={form.sales_model}
                onChange={(e) => setForm({ ...form, sales_model: e.target.value })}
              >
                <option value="cod">Paiement à la livraison</option>
                <option value="prepaid">Prépayé</option>
                <option value="dropshipping">Dropshipping</option>
              </select>
            </Field>
            <Field label="Lien de l'image">
              <input
                className={inputClass}
                value={form.thumbnail_url}
                onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                placeholder="https://…"
              />
            </Field>
            <Field label="Lien de la vidéo">
              <input
                className={inputClass}
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                placeholder="https://…"
              />
            </Field>
            <Field label="Lien vers la publicité" wide>
              <input
                className={inputClass}
                value={form.source_url}
                onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                placeholder="https://facebook.com/ads/library/…"
              />
            </Field>
            <Field label="Description" wide>
              <textarea
                rows={3}
                className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:border-primary"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <Field label="Pourquoi ça se vend" wide>
              <textarea
                rows={3}
                className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:border-primary"
                value={form.why_it_sells}
                onChange={(e) => setForm({ ...form, why_it_sells: e.target.value })}
              />
            </Field>
            <div className="flex gap-3 sm:col-span-2">
              <Button type="submit" disabled={add.isPending}>
                {add.isPending ? "Ajout…" : "Enregistrer"}
              </Button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-border px-4 text-sm font-semibold"
              >
                Annuler
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <h2 className="flex items-center gap-2 border-b border-border p-4 font-bold">
          <ChevronDown className="h-4 w-4" /> Publicités publiées
        </h2>
        <ul className="divide-y divide-border">
          {rows.map((ad) => (
            <li key={ad.id} className="flex items-center gap-3 p-3">
              {ad.thumbnail_url || ad.media_url ? (
                <img
                  src={(ad.thumbnail_url || ad.media_url) as string}
                  alt={ad.title}
                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="h-12 w-12 shrink-0 rounded-md bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{ad.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {platformLabel(ad.platform)} · {countryLabel(ad.country)} · {ad.category} ·{" "}
                  {ad.likes.toLocaleString("fr-FR")} J'aime
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove.mutate(ad.id)}
                aria-label="Supprimer"
                className="shrink-0 rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {rows.length === 0 ? (
            <li className="p-4 text-sm text-muted-foreground">Aucune publicité pour l'instant.</li>
          ) : null}
        </ul>
      </section>
    </AdminShell>
  );
}
