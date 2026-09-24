import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/fr")({
  component: FrRedirect,
});

function FrRedirect() {
  const navigate = useNavigate();
  const { setLanguage } = useI18n();

  useEffect(() => {
    setLanguage("fr");
    void navigate({ to: "/", replace: true });
  }, [navigate, setLanguage]);

  return null;
}
