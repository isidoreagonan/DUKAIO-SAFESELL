import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Cpu, FlaskConical, Image, ImagePlus, Loader2, Send, Type, X } from "lucide-react";
import { AdminShell, Panel } from "@/components/admin/shell";
import {
  adminAiEngineGet,
  adminAiEngineSet,
  adminAiEngineTry,
} from "@/lib/admin.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/modeles-ia")({
  loader: () => adminAiEngineGet(),
  head: () => ({
    meta: [
      { title: "Modèles IA · Administration DUKAIO" },
      { name: "description", content: "Choix des moteurs IA de la plateforme." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminAiEngines,
});

type Engine = "kie" | "gemini";

const ENGINES: {
  value: Engine;
  name: string;
  detail: string;
  cost: string;
}[] = [
  {
    value: "kie",
    name: "Kie.ai",
    detail: "Facturé sur le compte Kie.ai. Stable et déjà en production.",
    cost: "Textes et visuels au tarif Kie.ai",
  },
  {
    value: "gemini",
    name: "Gemini (Google)",
    detail: "Vertex AI (Google Cloud) : facturé sur vos crédits Google. Rapide et économique.",
    cost: "Textes < 0,03 $ · visuel ≈ 0,04 $ (Flash)",
  },
];

function EnginePicker({
  icon: Icon,
  title,
  hint,
  value,
  onChange,
  kieConfigured,
  geminiConfigured,
}: {
  icon: typeof Type;
  title: string;
  hint: string;
  value: Engine;
  onChange: (engine: Engine) => void;
  kieConfigured: boolean;
  geminiConfigured: boolean;
}) {
  return (
    <div className="rounded-[10px] border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-[8px] bg-accent">
          <Icon className="size-4" />
        </span>
        <div>
          <p className="text-sm font-bold tracking-tight">{title}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {ENGINES.map((engine) => {
          const configured = engine.value === "kie" ? kieConfigured : geminiConfigured;
          const active = value === engine.value;
          return (
            <button
              key={engine.value}
              type="button"
              disabled={!configured}
              onClick={() => onChange(engine.value)}
              className={cn(
                "cursor-pointer rounded-[8px] border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? "border-primary bg-accent shadow-[inset_0_0_0_1px_var(--color-primary)]"
                  : "border-border hover:bg-muted",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">{engine.name}</span>
                {active ? (
                  <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                ) : null}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">{engine.detail}</span>
              <span className="mt-2 block text-[11px] font-semibold text-muted-foreground">
                {configured ? engine.cost : "Clé API non configurée"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AdminAiEngines() {
  const initial = Route.useLoaderData();
  const router = useRouter();
  const save = useServerFn(adminAiEngineSet);
  const runTry = useServerFn(adminAiEngineTry);

  const [textEngine, setTextEngine] = useState<Engine>(initial.textEngine);
  const [imageEngine, setImageEngine] = useState<Engine>(initial.imageEngine);
  const [fallback, setFallback] = useState(initial.fallbackToKie);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  type TryBox = {
    engine: Engine;
    kind: "text" | "image";
    label: string;
    prompt: string;
    photo?: string | null;
    running: boolean;
    text?: string | null;
    image?: string | null;
    ms?: number;
    error?: string | null;
  };
  const [tryBox, setTryBox] = useState<TryBox | null>(null);

  const dirty =
    textEngine !== initial.textEngine ||
    imageEngine !== initial.imageEngine ||
    fallback !== initial.fallbackToKie;

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      await save({
        data: { textEngine, imageEngine, fallbackToKie: fallback },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  function openTry(engine: Engine, kind: "text" | "image", label: string) {
    setTryBox({ engine, kind, label, prompt: "", running: false });
  }

  async function launchTry() {
    if (!tryBox || tryBox.running) return;
    const { engine, kind, prompt, photo } = tryBox;
    setTryBox((prev) =>
      prev ? { ...prev, running: true, error: null, text: null, image: null } : prev,
    );
    try {
      const result = await runTry({
        data: { engine, kind, prompt: prompt.trim(), photo: photo ?? null },
      });
      setTryBox((prev) =>
        prev
          ? {
              ...prev,
              running: false,
              ms: result.ms,
              text: result.text ?? null,
              image: result.image ?? null,
              error: result.ok ? null : ("error" in result ? result.error : null) ?? "Échec",
            }
          : prev,
      );
    } catch (err) {
      setTryBox((prev) =>
        prev
          ? {
              ...prev,
              running: false,
              error: err instanceof Error ? err.message : "Essai impossible.",
            }
          : prev,
      );
    }
  }

  return (
    <AdminShell
      title="Modèles IA"
      subtitle="Choisissez quel moteur rédige les textes et génère les visuels des fiches produits"
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <EnginePicker
          icon={Type}
          title="Textes de vente"
          hint="Noms, descriptions, SEO, pages de vente"
          value={textEngine}
          onChange={setTextEngine}
          kieConfigured={initial.kieConfigured}
          geminiConfigured={initial.geminiConfigured}
        />
        <EnginePicker
          icon={Image}
          title="Visuels de section"
          hint="Photos de mise en situation générées"
          value={imageEngine}
          onChange={setImageEngine}
          kieConfigured={initial.kieConfigured}
          geminiConfigured={initial.geminiConfigured}
        />
      </div>

      <Panel title="Bascule de sécurité">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={fallback}
            onChange={(event) => setFallback(event.target.checked)}
            className="mt-1 size-4 accent-[var(--color-primary)]"
          />
          <span>
            <span className="block text-sm font-bold">
              Basculer automatiquement vers Kie.ai si Gemini échoue
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Recommandé : en cas de clé Gemini bloquée ou de quota dépassé, la génération
              continue sur Kie.ai sans interruption pour le vendeur.
            </span>
          </span>
        </label>
      </Panel>

      <Panel title="Essayer les moteurs">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {(
            [
              { engine: "kie" as const, kind: "text" as const, label: "Kie.ai · texte", ok: initial.kieConfigured },
              { engine: "kie" as const, kind: "image" as const, label: "Kie.ai · visuel", ok: initial.kieConfigured },
              { engine: "gemini" as const, kind: "text" as const, label: "Gemini · texte", ok: initial.geminiConfigured },
              { engine: "gemini" as const, kind: "image" as const, label: "Gemini · visuel", ok: initial.geminiConfigured },
            ]
          ).map((test) => (
            <button
              key={`${test.engine}:${test.kind}`}
              type="button"
              disabled={!test.ok}
              onClick={() => openTry(test.engine, test.kind, test.label)}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] bg-foreground px-3 py-2.5 text-xs font-bold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FlaskConical className="size-3.5" />
              {test.ok ? test.label : `${test.label} · clé absente`}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Chaque essai ouvre une fenêtre où vous écrivez votre demande. L'essai « visuel » génère
          une vraie image : il est facturé quelques centimes sur le compte du moteur essayé.
        </p>
      </Panel>

      {tryBox ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-foreground/45 p-0 sm:items-center sm:p-6"
          onClick={() => setTryBox(null)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[14px] border border-border bg-card shadow-card sm:rounded-[14px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-bold tracking-tight">{tryBox.label}</p>
                <p className="text-xs text-muted-foreground">
                  {tryBox.kind === "image"
                    ? "Décrivez le visuel à générer"
                    : "Écrivez la consigne de rédaction"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTryBox(null)}
                className="grid size-8 cursor-pointer place-items-center rounded-[8px] border border-border transition-colors hover:bg-muted"
                aria-label="Fermer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              <textarea
                value={tryBox.prompt}
                onChange={(event) =>
                  setTryBox((prev) => (prev ? { ...prev, prompt: event.target.value } : prev))
                }
                rows={3}
                placeholder={
                  tryBox.kind === "image"
                    ? "Ex. : mets ce produit sur un fond studio beige, lumière douce"
                    : "Ex. : rédige une description de vente pour ce produit"
                }
                className="w-full resize-y rounded-[8px] border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />

              {/* Photo du produit : le moteur travaille sur le vrai article. */}
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-[8px] border border-border px-3 py-2 text-xs font-bold transition-colors hover:bg-muted">
                  <ImagePlus className="size-4" />
                  {tryBox.photo ? "Changer la photo" : "Ajouter la photo du produit"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        setTryBox((prev) =>
                          prev ? { ...prev, error: "Photo trop lourde (5 Mo maximum)." } : prev,
                        );
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () =>
                        setTryBox((prev) =>
                          prev
                            ? { ...prev, photo: String(reader.result), error: null }
                            : prev,
                        );
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {tryBox.photo ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={tryBox.photo}
                      alt="Produit envoyé pour l'essai"
                      className="size-12 rounded-[8px] border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setTryBox((prev) => (prev ? { ...prev, photo: null } : prev))}
                      className="cursor-pointer text-xs font-bold text-muted-foreground hover:text-destructive"
                    >
                      Retirer
                    </button>
                  </div>
                ) : null}
              </div>

              {tryBox.error ? (
                <p className="flex items-start gap-1.5 text-xs font-semibold text-destructive">
                  <X className="mt-0.5 size-3.5 shrink-0" />
                  {tryBox.error}
                </p>
              ) : null}
              {tryBox.running ? (
                <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> Génération en cours…
                </p>
              ) : null}
              {tryBox.text ? (
                <div className="rounded-[8px] border border-border bg-muted/40 p-3">
                  <p className="whitespace-pre-wrap text-sm">{tryBox.text}</p>
                </div>
              ) : null}
              {tryBox.image ? (
                <img
                  src={tryBox.image}
                  alt="Visuel généré pendant l'essai"
                  className="w-full rounded-[8px] border border-border"
                />
              ) : null}
              {tryBox.ms !== undefined && !tryBox.running ? (
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Réponse en {Math.round(tryBox.ms / 100) / 10} s
                </p>
              ) : null}
            </div>

            <div className="border-t border-border px-4 py-3">
              <button
                type="button"
                disabled={tryBox.running || !tryBox.prompt.trim()}
                onClick={launchTry}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tryBox.running ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Lancer l'essai
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={onSave}
          className="flex cursor-pointer items-center gap-2 rounded-[8px] bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Cpu className="size-4" />}
          Enregistrer les moteurs
        </button>
        {saved ? (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
            <Check className="size-4" /> Réglage enregistré
          </span>
        ) : null}
        {error ? <span className="text-sm font-semibold text-destructive">{error}</span> : null}
      </div>
    </AdminShell>
  );
}
