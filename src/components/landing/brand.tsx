export function BrandLogo({ className = "h-6 sm:h-7" }: { className?: string }) {
  return (
    <img
      src="/landing/dukaio-logo.png"
      alt="DUKAIO"
      className={`${className} w-auto select-none`}
      draggable={false}
    />
  );
}
