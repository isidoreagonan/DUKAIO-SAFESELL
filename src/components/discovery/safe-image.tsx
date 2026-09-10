import { useState, useEffect, type ReactNode } from "react";
import { ImageOff } from "lucide-react";

export function SafeImage({
  src,
  alt = "",
  className = "",
  fallback,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  fallback?: ReactNode;
}) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  if (!src || error) {
    return (
      fallback ?? (
        <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
          <ImageOff className="h-4 w-4" />
        </div>
      )
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className={className}
    />
  );
}
