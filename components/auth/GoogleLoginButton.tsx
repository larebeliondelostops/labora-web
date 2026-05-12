"use client";

import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/utils";

interface GoogleLoginButtonProps {
  redirectTo?: string;
  label?: string;
  disabledLabel?: string;
  className?: string;
}

export function GoogleLoginButton({
  redirectTo = "/app/dashboard",
  label = "Continuar con Google",
  disabledLabel = "Inicio de sesion con Google no disponible",
  className,
}: GoogleLoginButtonProps) {
  const handleGoogleLogin = () => {
    if (!publicEnv.googleLoginEnabled) {
      return;
    }

    const params = new URLSearchParams({ redirect_to: redirectTo });
    window.location.href = `${publicEnv.apiUrl}/auth/google/login?${params.toString()}`;
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={!publicEnv.googleLoginEnabled}
      className={cn(
        "flex w-full items-center justify-center gap-3 rounded-2xl border border-labora-ui bg-white px-4 py-3 text-sm font-semibold text-labora-charcoal shadow-sm transition hover:bg-labora-ivory focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-labora-ui bg-white text-xs font-bold text-labora-green">
        G
      </span>
      {publicEnv.googleLoginEnabled ? label : disabledLabel}
    </button>
  );
}
