/**
 * Réglages du robot WhatsApp : connexion du numéro (API officielle Meta),
 * message d'accueil, questions fréquentes et test d'envoi.
 */
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, MessageCircle, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  getWhatsappSettings,
  listWhatsappConversations,
  saveWhatsappSettings,
  sendWhatsappTest,
} from "@/lib/whatsapp.functions";
import { WhatsappConnect } from "@/components/settings/whatsapp-connect";


const inputCls =
  "h-11 w-full rounded-[6px] border border-border bg-muted/30 px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background";
const areaCls =
  "w-full rounded-[6px] border border-border bg-muted/30 p-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background";

function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string | undefined }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function CopyField({ label, value, hint }: { label: string; value: string; hint?: string | undefined }) {
  const [copied, setCopied] = useState(false);
  return (
    <Row label={label} hint={hint}>
      <div className="flex gap-2">
        <input readOnly value={value} className={inputCls} />
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[6px] border border-border hover:bg-accent"
          aria-label={`Copier ${label}`}
        >
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </Row>
  );
}

export function WhatsappPanel({ storeId }: { storeId: string | undefined }) {
  const fetchSettings = useServerFn(getWhatsappSettings);
  const save = useServerFn(saveWhatsappSettings);
  const test = useServerFn(sendWhatsappTest);
  const fetchConversations = useServerFn(listWhatsappConversations);
  const queryClient = useQueryClient();

  const settings = useQuery({
    queryKey: ["whatsapp", storeId],
    enabled: Boolean(storeId),
    queryFn: () => fetchSettings({ data: { storeId: storeId! } }),
  });

  const conversations = useQuery({
    queryKey: ["whatsapp-conversations", storeId],
    enabled: Boolean(storeId),
    queryFn: () => fetchConversations({ data: { storeId: storeId! } }),
    refetchInterval: 30_000,
  });

  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [displayPhone, setDisplayPhone] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [greeting, setGreeting] = useState("");
  const [faq, setFaq] = useState<{ q: string; a: string }[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const data = settings.data;
    if (!data) return;
    setPhoneNumberId(data.phoneNumberId ?? "");
    setWabaId(data.wabaId ?? "");
    setDisplayPhone(data.displayPhone ?? "");
    setGreeting(data.greeting ?? "");
    setFaq(data.faq);
    setIsActive(data.isActive);
  }, [settings.data]);

  if (!storeId || settings.isLoading) {
    return (
      <div className="grid h-40 place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const data = settings.data;

  const persist = async (extra?: { isActive?: boolean }) => {
    setBusy(true);
    const result = await save({
      data: {
        storeId,
        phoneNumberId,
        wabaId,
        displayPhone,
        ...(accessToken ? { accessToken } : {}),
        greeting,
        faq: faq.filter((entry) => entry.q.trim().length > 1 && entry.a.trim().length > 1),
        isActive: extra?.isActive ?? isActive,
      },
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.reason ?? "Enregistrement impossible.");
      return false;
    }
    setAccessToken("");
    if (extra?.isActive !== undefined) setIsActive(extra.isActive);
    await queryClient.invalidateQueries({ queryKey: ["whatsapp", storeId] });
    toast.success("Réglages WhatsApp enregistrés.");
    return true;
  };

  return (
    <div className="space-y-5">
      <WhatsappConnect
        storeId={storeId}
        connected={Boolean(data?.hasToken && data?.phoneNumberId)}
        displayPhone={data?.displayPhone ?? null}
        connectMode={data?.connectMode ?? "manual"}
      />

      <details className="rounded-[6px] border border-border bg-background">
        <summary className="cursor-pointer list-none p-4 text-sm font-bold sm:p-5">
          Configuration manuelle (avancée)
        </summary>
        <div className="border-t border-border p-4 sm:p-5">

        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[6px] bg-accent text-accent-foreground">
            <MessageCircle className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold">Robot WhatsApp</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Vos clients écrivent à votre numéro WhatsApp : le robot présente vos produits, prend
              la commande complète et l'enregistre dans votre tableau de bord.
            </p>
          </div>
          <span
            className={`ml-auto shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              isActive && data?.hasToken
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isActive && data?.hasToken ? "Actif" : "Inactif"}
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <CopyField
            label="Adresse du webhook (Callback URL)"
            value={data?.webhookUrl ?? ""}
            hint="À coller dans Meta → WhatsApp → Configuration."
          />
          <CopyField
            label="Jeton de vérification (Verify token)"
            value={data?.verifyToken ?? ""}
            hint="À coller juste en dessous du webhook dans Meta."
          />
          <Row
            label="Identifiant du numéro (Phone number ID)"
            hint="Visible dans Meta → WhatsApp → Configuration de l'API."
          >
            <input
              value={phoneNumberId}
              onChange={(event) => setPhoneNumberId(event.target.value)}
              className={inputCls}
              placeholder="123456789012345"
            />
          </Row>
          <Row label="Identifiant du compte professionnel (WABA ID)">
            <input
              value={wabaId}
              onChange={(event) => setWabaId(event.target.value)}
              className={inputCls}
              placeholder="Optionnel"
            />
          </Row>
          <Row label="Numéro WhatsApp affiché">
            <input
              value={displayPhone}
              onChange={(event) => setDisplayPhone(event.target.value)}
              className={inputCls}
              placeholder="+229 00 00 00 00"
            />
          </Row>
          <Row
            label="Jeton d'accès permanent (Access token)"
            hint={
              data?.hasToken
                ? "Un jeton est déjà enregistré. Laissez vide pour le conserver."
                : "Créez un jeton permanent dans Meta → Utilisateurs système."
            }
          >
            <input
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
              className={inputCls}
              type="password"
              placeholder={data?.hasToken ? "••••••••••••" : "EAAG..."}
            />
          </Row>
        </div>

        <div className="mt-4">
          <Row
            label="Message d'accueil"
            hint="Laissez vide pour le message par défaut avec le nom de votre boutique."
          >
            <textarea
              rows={2}
              value={greeting}
              onChange={(event) => setGreeting(event.target.value)}
              className={areaCls}
              placeholder="Bonjour 👋 Bienvenue chez ma boutique !"
            />
          </Row>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void persist()}
            className="inline-flex h-11 items-center gap-2 rounded-[6px] bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Enregistrer
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void persist({ isActive: !isActive })}
            className="inline-flex h-11 items-center gap-2 rounded-[6px] border border-border px-4 text-sm font-semibold hover:bg-accent disabled:opacity-60"
          >
            {isActive ? "Désactiver le robot" : "Activer le robot"}
          </button>
        </div>
        </div>
      </details>


      <section className="rounded-[6px] border border-border bg-background p-4 sm:p-5">
        <h3 className="text-sm font-bold">Tester l'envoi</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Entrez un numéro au format international (sans + ni espace) pour recevoir un message test.
          Le tout premier message part sous forme de modèle officiel WhatsApp (« hello_world ») :
          c'est la seule façon d'écrire à un client qui ne vous a pas encore répondu. Le numéro doit
          aussi figurer dans la liste des destinataires autorisés de votre compte WhatsApp de test.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={testTo}
            onChange={(event) => setTestTo(event.target.value)}
            className={`${inputCls} max-w-xs`}
            placeholder="22900000000"
          />
          <button
            type="button"
            disabled={busy || testTo.replace(/[^0-9]/g, "").length < 8}
            onClick={async () => {
              setBusy(true);
              const result = await test({ data: { storeId, to: testTo } });
              setBusy(false);
              if (result.ok) toast.success("Message test envoyé.");
              else toast.error(result.reason ?? "Envoi impossible.");
            }}
            className="inline-flex h-11 items-center gap-2 rounded-[6px] border border-border px-4 text-sm font-semibold hover:bg-accent disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            Envoyer
          </button>
        </div>
      </section>

      <section className="rounded-[6px] border border-border bg-background p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold">Questions fréquentes</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Le robot propose ces réponses quand un client choisit « Poser une question ».
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFaq((list) => [...list, { q: "", a: "" }])}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[6px] border border-border px-3 text-sm font-semibold hover:bg-accent"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {faq.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune question pour l'instant.</p>
          ) : null}
          {faq.map((entry, index) => (
            <div key={index} className="rounded-[6px] border border-border p-3">
              <div className="flex gap-2">
                <input
                  value={entry.q}
                  onChange={(event) =>
                    setFaq((list) =>
                      list.map((row, i) => (i === index ? { ...row, q: event.target.value } : row)),
                    )
                  }
                  className={inputCls}
                  placeholder="Livrez-vous à Cotonou ?"
                />
                <button
                  type="button"
                  onClick={() => setFaq((list) => list.filter((_, i) => i !== index))}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-[6px] border border-border hover:bg-accent"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <textarea
                rows={2}
                value={entry.a}
                onChange={(event) =>
                  setFaq((list) =>
                    list.map((row, i) => (i === index ? { ...row, a: event.target.value } : row)),
                  )
                }
                className={`${areaCls} mt-2`}
                placeholder="Oui, livraison en 24h à Cotonou, paiement à la livraison."
              />
            </div>
          ))}
        </div>
      </section>

      {(conversations.data?.length ?? 0) > 0 ? (
        <section className="rounded-[6px] border border-border bg-background p-4 sm:p-5">
          <h3 className="text-sm font-bold">Discussions récentes</h3>
          <ul className="mt-3 divide-y divide-border text-sm">
            {conversations.data?.map((row) => (
              <li key={row.waId} className="flex items-center justify-between py-2">
                <span className="font-medium">+{row.waId}</span>
                <span className="text-muted-foreground">
                  {row.state} · {new Date(row.lastMessageAt).toLocaleString("fr-FR")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
