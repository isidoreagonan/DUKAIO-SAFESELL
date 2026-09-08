/**
 * Marques de paiement vectorielles (images réelles, pas du texte).
 * Chaque logo est dessiné en SVG pour rester net sur tous les écrans.
 */

type IconProps = { className?: string };

const Wrap = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <span
    role="img"
    aria-label={label}
    className="grid h-8 w-[52px] shrink-0 place-items-center rounded-[6px] border border-black/10 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
  >
    {children}
  </span>
);

const Visa = () => (
  <Wrap label="Visa">
    <span
      className="text-[13px] leading-none font-black tracking-tight italic"
      style={{ color: "#1A1F71", fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      VISA
    </span>
  </Wrap>
);

const Mastercard = () => (
  <Wrap label="Mastercard">
    <svg viewBox="0 0 40 24" className="h-5 w-auto" aria-hidden="true">
      <circle cx="15" cy="12" r="11" fill="#EB001B" />
      <circle cx="25" cy="12" r="11" fill="#F79E1B" />
      <path fill="#FF5F00" d="M20 3.2a11 11 0 0 0 0 17.6 11 11 0 0 0 0-17.6Z" />
    </svg>
  </Wrap>
);

const Amex = () => (
  <span
    role="img"
    aria-label="American Express"
    className="grid h-8 w-[52px] shrink-0 place-items-center rounded-[6px] bg-[#1F72CD] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
  >
    <span className="text-[8px] leading-none font-black tracking-tight text-white">AMEX</span>
  </span>
);

const ApplePay = () => (
  <span
    role="img"
    aria-label="Apple Pay"
    className="grid h-8 w-[52px] shrink-0 place-items-center rounded-[6px] border border-black/80 bg-white"
  >
    <svg viewBox="0 0 40 16" className="h-3.5 w-auto" aria-hidden="true">
      <path
        fill="#000"
        d="M8.4 2.6c-.5.6-1.3 1.1-2.1 1-.1-.8.3-1.7.8-2.2.5-.6 1.4-1 2.1-1.1.1.9-.3 1.7-.8 2.3ZM9.1 4.3c-1.2-.1-2.2.7-2.7.7-.6 0-1.4-.6-2.3-.6-1.2 0-2.3.7-2.9 1.8-1.2 2.1-.3 5.3.9 7 .6.8 1.3 1.8 2.2 1.7.9 0 1.2-.6 2.3-.6s1.4.6 2.3.6c1 0 1.6-.9 2.2-1.8.7-1 1-2 1-2-.1 0-1.9-.8-1.9-2.8 0-1.7 1.4-2.5 1.5-2.6-.8-1.1-2-1.3-2.6-1.4Z"
      />
      <path
        fill="#000"
        d="M18.6 2.2c2 0 3.4 1.4 3.4 3.4S20.5 9 18.5 9h-2.3v4.7h-1.9V2.2h4.3Zm-2.4 5.2h1.9c1.4 0 2.2-.7 2.2-1.8s-.8-1.8-2.2-1.8h-1.9v3.6ZM22.5 11.2c0-1.5 1.1-2.3 3.2-2.4l2-.1v-.6c0-.9-.6-1.3-1.6-1.3-.9 0-1.5.4-1.6 1.1h-1.8c.1-1.5 1.4-2.6 3.5-2.6 2.1 0 3.4 1.1 3.4 2.8v5.7h-1.8v-1.4h-.1c-.5.9-1.5 1.5-2.6 1.5-1.6 0-2.6-1-2.6-2.4Zm5.2-.8v-.6l-1.8.1c-1 .1-1.5.5-1.5 1.2s.6 1.1 1.4 1.1c1.1 0 1.9-.7 1.9-1.8ZM31.2 16.8v-1.5c.2 0 .5.1.7.1.7 0 1.1-.3 1.4-1.1l.2-.5-3.2-8.4h2l2.1 6.5h.1L36.6 5.4h1.9l-3.3 8.9c-.7 2-1.6 2.6-3.3 2.6-.2 0-.6 0-.7-.1Z"
      />
    </svg>
  </span>
);

const GPay = () => (
  <Wrap label="Google Pay">
    <svg viewBox="0 0 44 18" className="h-3.5 w-auto" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M9 8.1v3.2h4.5c-.2 1-1.3 2.9-4.5 2.9A5.1 5.1 0 0 1 9 4c1.3 0 2.4.5 3.1 1.2l2.3-2.2A8.3 8.3 0 0 0 9 .8 8.3 8.3 0 0 0 9 17.3c4.8 0 8-3.4 8-8.1 0-.5 0-.8-.1-1.1H9Z"
      />
      <path
        fill="#5F6368"
        d="M23.7 5.4c-2.4 0-4.2 1.8-4.2 4.2 0 2.3 1.8 4.2 4.2 4.2s4.2-1.9 4.2-4.2c0-2.4-1.8-4.2-4.2-4.2Zm0 6.7c-1.2 0-2.2-1-2.2-2.5s1-2.5 2.2-2.5 2.2 1 2.2 2.5-1 2.5-2.2 2.5ZM43.3 5.6h-2.1l-2.3 5.9h-.1l-2.4-5.9h-2.1l3.5 8-2 4.4h2.1l5.4-12.4ZM32.6 6.4c-.6-.6-1.5-.9-2.5-.9-1.4 0-2.7.6-3.3 1.7l1.8.7c.3-.5.9-.8 1.5-.8.9 0 1.6.5 1.6 1.3v.3c-.3-.2-1-.4-1.7-.4-1.7 0-3.2.9-3.2 2.6 0 1.5 1.3 2.5 2.8 2.5 1 0 1.8-.4 2.2-1.1h.1v.9h1.9V8.6c0-1-.3-1.7-.8-2.2Zm-2.4 5.7c-.6 0-1.3-.3-1.3-1 0-.8.9-1.1 1.6-1.1.6 0 .9.1 1.3.3-.1 1-.9 1.8-1.6 1.8Z"
      />
    </svg>
  </Wrap>
);

const ShopPay = () => (
  <span
    role="img"
    aria-label="Shop Pay"
    className="grid h-8 w-[52px] shrink-0 place-items-center rounded-[6px] bg-[#5A31F4]"
  >
    <span className="text-[11px] leading-none font-extrabold tracking-tight text-white lowercase">
      shop
    </span>
  </span>
);

const Discover = () => (
  <Wrap label="Discover">
    <span className="flex items-center gap-[2px] text-[7px] leading-none font-bold tracking-tight text-[#231F20] uppercase">
      DISC
      <span className="inline-block size-2 rounded-full bg-[#FF6000]" />
      VER
    </span>
  </Wrap>
);

const PayPal = () => (
  <Wrap label="PayPal">
    <svg viewBox="0 0 28 18" className="h-4 w-auto" aria-hidden="true">
      <path
        fill="#003087"
        d="M6.5 17.2H3.9c-.3 0-.5-.3-.4-.5L5.8 1.3c0-.3.3-.5.6-.5h5c2.8 0 4.5 1.4 4.1 4.1-.4 3-2.7 4.6-5.7 4.6H8.2c-.3 0-.5.2-.6.5l-.7 6.7c-.1.3-.2.5-.4.5Z"
      />
      <path
        fill="#009CDE"
        d="M12.6 17.2H10c-.3 0-.5-.3-.4-.5l2.3-15.4c0-.3.3-.5.6-.5h5c2.8 0 4.5 1.4 4.1 4.1-.4 3-2.7 4.6-5.7 4.6h-1.6c-.3 0-.5.2-.6.5l-.7 6.7c-.1.3-.2.5-.4.5Z"
        opacity=".85"
      />
    </svg>
  </Wrap>
);

const Klarna = () => (
  <Wrap label="Klarna">
    <span className="text-[8px] leading-none font-black tracking-tight text-[#0B051D]">
      Klarna.
    </span>
  </Wrap>
);

const brands: Record<string, () => React.JSX.Element> = {
  visa: Visa,
  mastercard: Mastercard,
  amex: Amex,
  americanexpress: Amex,
  applepay: ApplePay,
  apple: ApplePay,
  gpay: GPay,
  googlepay: GPay,
  google: GPay,
  shoppay: ShopPay,
  shop: ShopPay,
  discover: Discover,
  paypal: PayPal,
  klarna: Klarna,
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z]/g, "");

/** Rend le logo réel du moyen de paiement, ou une pastille texte en secours */
export function PayIcon({ label, className }: { label: string } & IconProps) {
  const Brand = brands[normalize(label)];
  if (Brand) return <Brand />;
  return (
    <span
      className={
        className ??
        "grid h-8 shrink-0 place-items-center rounded-[6px] border border-black/10 bg-white px-2 text-[9px] font-bold tracking-wide text-[#231F20] uppercase"
      }
    >
      {label}
    </span>
  );
}

export const payBrandKeys = Object.keys(brands);
