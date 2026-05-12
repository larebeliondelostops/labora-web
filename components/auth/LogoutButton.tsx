"use client";

import { useState } from "react";

import { logout } from "@/lib/auth";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      await logout();
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="rounded-2xl border border-labora-ui bg-white px-4 py-2 text-sm font-semibold text-labora-charcoal transition hover:bg-labora-ivory focus:outline-none focus:ring-2 focus:ring-labora-green focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isLoading ? "Cerrando..." : "Cerrar sesion"}
    </button>
  );
}
