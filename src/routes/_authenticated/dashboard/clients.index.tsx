import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Download,
  Search,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  MessageCircle,
  ShoppingBag,
  Clock,
  Sparkles,
  X,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { ModuleEmptyState, ModuleHeader } from "@/components/dashboard/empty-state";
import { useStore, formatFcfa } from "@/lib/store";
import { storeUrl } from "@/lib/storefront";
import {
  useCustomers,
  useCreateCustomer,
  exportCustomersCsv,
  type Customer,
} from "@/lib/customers";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/dashboard/clients/")({
  head: () => ({
    meta: [
      { title: "Clients | DUKAIO" },
      {
        name: "description",
        content:
          "Retrouvez tous vos clients DUKAIO : coordonnées, historique de commandes et valeur totale dépensée.",
      },
      { property: "og:title", content: "Clients | DUKAIO" },
      {
        property: "og:description",
        content: "Fiches clients, historique d'achats et valeur par client.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClientsPage,
});

function initials(value: string) {
  return value
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function cleanPhoneForWhatsApp(phone: string) {
  return phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function ClientsPage() {
  const { dict, isEn } = useI18n();
  const { data: store } = useStore();
  const { data: customers = [], isLoading } = useCustomers(store?.id);
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const publicStoreUrl = store?.subdomain
    ? storeUrl(store.subdomain, store.custom_domain)
    : "/dashboard/boutique";

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((c) =>
      `${c.full_name} ${c.email ?? ""} ${c.phone ?? ""} ${c.city ?? ""} ${c.address ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [customers, q]);

  const totalRevenue = useMemo(
    () => customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0),
    [customers],
  );

  const payingCustomers = useMemo(
    () => customers.filter((c) => c.orders_count > 0).length,
    [customers],
  );

  const handleExport = () => {
    if (customers.length === 0) {
      toast.info("Aucun client à exporter pour le moment.");
      return;
    }
    exportCustomersCsv(filtered.length > 0 ? filtered : customers, store?.store_name);
    toast.success("Fichier CSV des clients téléchargé !");
  };

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <ModuleHeader
          title={dict.clientsPage.title}
          count={String(customers.length)}
          description={dict.clientsPage.subtitle}
          actions={
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleExport}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground px-3.5 py-2.5 text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4 text-muted-foreground" />
                <span>{dict.clientsPage.export}</span>
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>{dict.clientsPage.addClient}</span>
              </button>
            </div>
          }
        />

        {isLoading ? (
          <div className="rounded-2xl border border-stone-200/80 bg-white p-12 text-center text-sm text-stone-500">
            {isEn ? "Loading customers…" : "Chargement de vos clients…"}
          </div>
        ) : customers.length === 0 ? (
          <ModuleEmptyState
            icon={Users}
            title={dict.clientsPage.noClients}
            description={dict.clientsPage.noClientsSubtitle}
            action={
              <a
                href={publicStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" /> {dict.clientsPage.visitStore}
              </a>
            }
          />
        ) : (
          <>
            {/* Statistiques synthétiques compactes et responsives */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-xs">
                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  {isEn ? "Total customers" : "Total clients"}
                </p>
                <p className="mt-1 font-display text-lg sm:text-2xl font-extrabold text-foreground">
                  {customers.length}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-xs">
                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  {isEn ? "With orders" : "Acheteurs"}
                </p>
                <p className="mt-1 font-display text-lg sm:text-2xl font-extrabold text-foreground">
                  {payingCustomers}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-xs">
                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  {dict.analysesPage.revenue}
                </p>
                <p className="mt-1 font-display text-xs sm:text-2xl font-extrabold text-orange-600 dark:text-orange-400 truncate">
                  {formatFcfa(totalRevenue)} <span className="text-[10px] sm:text-sm font-bold">FCFA</span>
                </p>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={dict.clientsPage.searchPlaceholder}
                className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-10 text-sm outline-none focus:border-orange-500 transition-colors shadow-xs"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-stone-200/80 bg-white dark:bg-stone-900 dark:border-stone-800 p-10 text-center">
                <p className="text-base font-bold text-stone-900 dark:text-stone-100">
                  {isEn ? `No customers found for « ${q} »` : `Aucun client trouvé pour « ${q} »`}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  {isEn ? "Check spelling of name, phone or email." : "Vérifiez l'orthographe du nom, numéro ou adresse email."}
                </p>
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  {isEn ? "Clear search" : "Effacer la recherche"}
                </button>
              </div>
            ) : (
              <>
                {/* VUE MOBILE : Cartes clients modernes et fluides (Zéro défilement horizontal !) */}
                <div className="space-y-3 md:hidden">
                  {filtered.map((customer) => {
                    const wa = customer.phone ? cleanPhoneForWhatsApp(customer.phone) : null;
                    return (
                      <div
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        className="relative flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs hover:border-orange-500/40 hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                      >
                        {/* En-tête de la carte : Avatar, Nom, Badge Commandes & Montant Total */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold text-sm border border-orange-500/20">
                              {initials(customer.full_name || customer.email || "CL")}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-sm truncate">
                                {customer.full_name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className={cn(
                                    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                    customer.orders_count > 1
                                      ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
                                      : customer.orders_count === 1
                                        ? "bg-muted text-foreground"
                                        : "bg-muted/60 text-muted-foreground",
                                  )}
                                >
                                  {customer.orders_count}{" "}
                                  {customer.orders_count > 1 ? dict.clientsPage.orders : dict.clientsPage.orderSingular}
                                </span>
                                {customer.last_order_at && (
                                  <span className="text-[11px] text-muted-foreground">
                                    · {formatDate(customer.last_order_at)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Montant total dépensé */}
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                              {dict.clientsPage.totalSpent}
                            </span>
                            <span className="font-display font-black text-sm text-orange-600 dark:text-orange-400">
                              {formatFcfa(customer.total_spent)} FCFA
                            </span>
                          </div>
                        </div>

                        {/* Coordonnées : Téléphone (WhatsApp), Email, Ville */}
                        <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                          {customer.phone ? (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="font-medium text-foreground">{customer.phone}</span>
                              </div>
                              {wa && (
                                <a
                                  href={`https://wa.me/${wa}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-bold hover:bg-emerald-500/20 transition-colors"
                                >
                                  <MessageCircle className="h-3 w-3" />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                            </div>
                          ) : null}

                          {customer.email ? (
                            <div className="flex items-center gap-2 truncate">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{customer.email}</span>
                            </div>
                          ) : null}

                          {(customer.city || customer.address) ? (
                            <div className="flex items-center gap-2 truncate">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">
                                {customer.city ? customer.city + (customer.address ? ` · ${customer.address}` : "") : customer.address}
                              </span>
                            </div>
                          ) : null}
                        </div>

                        {/* Pied de carte : Raccourci vers la fiche client */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                          <span className="text-[11px] text-muted-foreground">
                            {isEn ? "Tap to view profile" : "Toucher pour voir la fiche"}
                          </span>
                          <span className="font-bold text-orange-600 dark:text-orange-400 flex items-center gap-0.5">
                            {isEn ? "Customer sheet →" : "Fiche client →"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* VUE DESKTOP : Tableau complet détaillé */}
                <div className="hidden md:block overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3.5">{dict.clientsPage.nameLabel}</th>
                          <th className="px-4 py-3.5">{isEn ? "Contact" : "Contact"}</th>
                          <th className="px-4 py-3.5">{dict.analysesPage.country}</th>
                          <th className="px-4 py-3.5 text-center">{dict.clientsPage.orders}</th>
                          <th className="px-4 py-3.5 text-right">{dict.clientsPage.totalSpent}</th>
                          <th className="px-4 py-3.5 text-right">{dict.clientsPage.lastOrder}</th>
                          <th className="px-4 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filtered.map((customer) => {
                          const wa = customer.phone ? cleanPhoneForWhatsApp(customer.phone) : null;
                          return (
                            <tr
                              key={customer.id}
                              className="hover:bg-muted/40 transition-colors group cursor-pointer"
                              onClick={() => setSelectedCustomer(customer)}
                            >
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 font-bold text-xs">
                                    {initials(customer.full_name || customer.email || "CL")}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-foreground truncate">
                                      {customer.full_name}
                                    </p>
                                    {customer.email ? (
                                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {customer.email}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-3.5">
                                {customer.phone ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-foreground font-medium">
                                      {customer.phone}
                                    </span>
                                    {wa ? (
                                      <a
                                        href={`https://wa.me/${wa}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 transition-colors"
                                        title={isEn ? "Contact on WhatsApp" : "Contacter sur WhatsApp"}
                                      >
                                        <MessageCircle className="h-3.5 w-3.5" />
                                      </a>
                                    ) : null}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </td>

                              <td className="px-4 py-3.5">
                                {customer.city || customer.address ? (
                                  <div className="text-xs text-muted-foreground truncate max-w-[180px] flex items-center gap-1">
                                    <MapPin className="h-3 w-3 shrink-0" />
                                    <span className="truncate">
                                      {customer.city
                                        ? customer.city + (customer.address ? ` · ${customer.address}` : "")
                                        : customer.address}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </td>

                              <td className="px-4 py-3.5 text-center">
                                <span
                                  className={cn(
                                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                    customer.orders_count > 1
                                      ? "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300"
                                      : customer.orders_count === 1
                                        ? "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                                        : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  {customer.orders_count}{" "}
                                  {customer.orders_count > 1 ? dict.clientsPage.orders : dict.clientsPage.orderSingular}
                                </span>
                              </td>

                              <td className="px-4 py-3.5 text-right">
                                <span className="font-display font-bold text-foreground">
                                  {formatFcfa(customer.total_spent)} FCFA
                                </span>
                              </td>

                              <td className="px-4 py-3.5 text-right text-xs text-muted-foreground">
                                {formatDate(customer.last_order_at)}
                              </td>

                              <td className="px-4 py-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCustomer(customer);
                                  }}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                                >
                                  {isEn ? "Customer sheet →" : "Fiche client →"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Modal Ajout manuel d'un client */}
      {modalOpen && store ? (
        <CreateCustomerDialog
          storeId={store.id}
          onClose={() => setModalOpen(false)}
        />
      ) : null}

      {/* Drawer / Fiche détail client */}
      {selectedCustomer ? (
        <CustomerDetailDialog
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      ) : null}
    </DashboardShell>
  );
}

function CreateCustomerDialog({
  storeId,
  onClose,
}: {
  storeId: string;
  onClose: () => void;
}) {
  const { dict, isEn } = useI18n();
  const create = useCreateCustomer(storeId);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error(isEn ? "Please enter customer name." : "Veuillez renseigner le nom du client.");
      return;
    }

    try {
      await create.mutateAsync({
        fullName,
        email,
        phone,
        city,
        address,
        notes,
      });
      toast.success(isEn ? "Customer added successfully!" : "Client ajouté avec succès !");
      onClose();
    } catch (err) {
      toast.error((err as Error).message || (isEn ? "Error saving customer" : "Erreur lors de l'enregistrement"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto no-scrollbar rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{dict.clientsPage.addManualTitle}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dict.clientsPage.addManualDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-foreground">{dict.clientsPage.nameLabel} *</span>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Awa Diallo"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-orange-500"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-foreground">{dict.clientsPage.phoneLabel} / WhatsApp</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+229 97000000"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-orange-500"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-foreground">{dict.clientsPage.emailLabel}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@exemple.com"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-orange-500"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-foreground">{dict.ordersDetailPage.city}</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Cotonou"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-orange-500"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-foreground">{isEn ? "Address / Neighborhood" : "Adresse / Quartier"}</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Cadjehoun"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-orange-500"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-foreground">{isEn ? "Internal note (optional)" : "Note interne (facultatif)"}</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isEn ? "Delivery preference, special instructions..." : "Préférence de livraison, instructions particulières..."}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-orange-500"
            />
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors cursor-pointer"
            >
              {dict.clientsPage.cancel}
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              {create.isPending ? (isEn ? "Saving…" : "Enregistrement…") : dict.clientsPage.saveClient}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CustomerDetailDialog({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  const { dict, isEn } = useI18n();
  const wa = customer.phone ? cleanPhoneForWhatsApp(customer.phone) : null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto no-scrollbar rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 font-extrabold text-base">
              {initials(customer.full_name || customer.email || "CL")}
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-foreground">{customer.full_name}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" /> {isEn ? "Joined on " : "Inscrit le "}{formatDate(customer.created_at)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats de l'acheteur */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-background p-3.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase">{dict.clientsPage.orders}</p>
            <p className="mt-1 font-display text-xl font-bold text-foreground">
              {customer.orders_count}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-3.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase">{dict.clientsPage.totalSpent}</p>
            <p className="mt-1 font-display text-xl font-bold text-orange-600 dark:text-orange-400">
              {formatFcfa(customer.total_spent)} FCFA
            </p>
          </div>
        </div>

        {/* Coordonnées */}
        <div className="space-y-3 rounded-xl border border-border bg-background p-4 text-sm">
          {customer.phone ? (
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {dict.clientsPage.phoneLabel}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{customer.phone}</span>
                {wa ? (
                  <a
                    href={`https://wa.me/${wa}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 text-xs font-semibold transition-colors"
                  >
                    <MessageCircle className="h-3 w-3" /> WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          {customer.email ? (
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {dict.clientsPage.sendEmail}
              </span>
              <a
                href={`mailto:${customer.email}`}
                className="font-semibold text-orange-600 hover:underline"
              >
                {customer.email}
              </a>
            </div>
          ) : null}

          {customer.city || customer.address ? (
            <div className="flex items-start justify-between gap-4">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 shrink-0">
                <MapPin className="h-3.5 w-3.5" /> {isEn ? "Address" : "Adresse"}
              </span>
              <span className="text-right text-foreground font-medium">
                {customer.city ? `${customer.city}, ` : ""}
                {customer.address ?? ""}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted transition-colors cursor-pointer"
          >
            {isEn ? "Close" : "Fermer"}
          </button>
        </div>
      </div>
    </div>
  );
}
