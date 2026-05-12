"use client";

import { useEffect, useState } from "react";
import { MonitorSmartphone, Trash2 } from "lucide-react";

import { EmptyState, FormErrorSummary, InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import { LoadingButton } from "@/components/auth/LoadingButton";
import { getApiErrorMessage } from "@/lib/auth-errors";
import { logoutAll } from "@/services/auth.service";
import { getSessions, revokeSession } from "@/services/session.service";
import type { AccountSession } from "@/types/session";

export function SecuritySettingsPage() {
  const [sessions, setSessions] = useState<AccountSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSessions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextSessions = await getSessions();
      setSessions(nextSessions);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "No pudimos cargar tus sesiones activas. Intentalo nuevamente.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevoke = async (sessionId: string) => {
    setRevokeId(sessionId);
    setError(null);
    setSuccess(null);

    try {
      await revokeSession(sessionId);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      setSuccess("Sesion cerrada correctamente.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "No pudimos cerrar esa sesion."));
    } finally {
      setRevokeId(null);
    }
  };

  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true);
    setError(null);
    setSuccess(null);

    try {
      await logoutAll();
      window.location.href = "/login";
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "No pudimos cerrar las sesiones."));
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-labora-green">
          Seguridad
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-labora-charcoal">
          Seguridad de cuenta
        </h1>
        <p className="mt-2 text-sm leading-6 text-labora-gray">
          Revisa tus sesiones activas y cierra accesos que no reconozcas.
        </p>
      </section>

      <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          Acceso con Google
        </h2>
        <p className="mt-2 text-sm leading-6 text-labora-gray">
          Labora no administra credenciales propias para tu cuenta. El ingreso se hace con
          Google y desde aqui puedes cerrar sesiones activas si no reconoces algun acceso.
        </p>
      </section>

      <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
              Sesiones activas
            </h2>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              La sesion actual aparece marcada si el backend la identifica.
            </p>
          </div>
          <LoadingButton
            type="button"
            isLoading={isLoggingOutAll}
            onClick={handleLogoutAll}
            className="bg-labora-deep sm:w-auto"
          >
            Cerrar todas
          </LoadingButton>
        </div>

        <div className="mt-5 grid gap-4">
          <FormErrorSummary message={error} />
          {success ? <InlineAlert tone="success">{success}</InlineAlert> : null}

          {isLoading ? <SkeletonCard /> : null}

          {!isLoading && sessions.length === 0 ? (
            <EmptyState message="No hay sesiones activas registradas." />
          ) : null}

          {sessions.map((session) => (
            <article
              key={session.id}
              className="flex flex-col gap-4 rounded-lg border border-labora-ui bg-labora-ivory p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex gap-3">
                <MonitorSmartphone className="mt-1 h-5 w-5 flex-none text-labora-green" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-labora-charcoal">
                      {session.deviceName || session.browser || "Dispositivo"}
                    </h3>
                    {session.isCurrent ? (
                      <span className="rounded-full bg-labora-green px-2 py-1 text-xs font-semibold text-white">
                        Actual
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-labora-gray">
                    {[session.os, session.location, session.ipAddress].filter(Boolean).join(" - ") ||
                      "Sin detalle disponible"}
                  </p>
                  {session.lastActiveAt ? (
                    <p className="mt-1 text-xs text-labora-gray">
                      Ultima actividad: {new Date(session.lastActiveAt).toLocaleString("es-CO")}
                    </p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                disabled={revokeId === session.id || session.isCurrent}
                onClick={() => handleRevoke(session.id)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {revokeId === session.id ? "Cerrando..." : "Cerrar sesion"}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
