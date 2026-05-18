"use client";

import Link from "next/link";
import { useState } from "react";
import { Filter, RefreshCcw } from "lucide-react";

import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import {
  useAdminLegalDrafts,
} from "@/src/modules/legal-actions/hooks/useLegalActions";
import {
  draftStatusLabels,
  legalActionTypeLabels,
  professionalReviewLabels,
} from "@/src/modules/legal-actions/utils/mapStatusToLabel";
import { formatDateTime } from "@/src/modules/cases/utils/caseFormatters";

export function AdminLegalDraftsPage() {
  const [status, setStatus] = useState("all");
  const [actionType, setActionType] = useState("all");
  const [query, setQuery] = useState("");
  const draftsResource = useAdminLegalDrafts({ status, actionType, query });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <AdminSidebar />
        <section className="space-y-5">
          <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Backoffice
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-labora-charcoal">
              Borradores juridicos
            </h1>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              Revisa documentos generados, prioriza casos y abre la vista de revision.
            </p>
          </header>

          <section className="rounded-2xl border border-labora-ui bg-white p-4 shadow-panel">
            <div className="flex items-center gap-2 text-sm font-semibold text-labora-charcoal">
              <Filter className="h-4 w-4 text-labora-green" aria-hidden="true" />
              Filtros
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <label className="block">
                <span className="text-xs font-semibold text-labora-gray">Estado</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui px-3 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="ready_for_edit">Listo para editar</option>
                  <option value="requires_review">Requiere revision</option>
                  <option value="approved">Aprobado</option>
                  <option value="failed">Fallido</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-labora-gray">Tipo</span>
                <select
                  value={actionType}
                  onChange={(event) => setActionType(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui px-3 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="petition">Derecho de peticion</option>
                  <option value="administrative_claim">Reclamacion</option>
                  <option value="reliquidation_request">Reliquidacion</option>
                  <option value="administrative_appeal">Recurso</option>
                  <option value="lawsuit_draft">Demanda</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs font-semibold text-labora-gray">
                  Caso o usuario
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui px-3 text-sm"
                  placeholder="Buscar por numero de caso"
                />
              </label>
            </div>
          </section>

          {draftsResource.error ? (
            <InlineAlert tone="error">{draftsResource.error}</InlineAlert>
          ) : null}

          {draftsResource.isLoading ? (
            <SkeletonCard />
          ) : (
            <section className="overflow-hidden rounded-2xl border border-labora-ui bg-white shadow-panel">
              <div className="flex items-center justify-between gap-3 border-b border-labora-ui p-4">
                <p className="text-sm font-semibold text-labora-charcoal">
                  {draftsResource.data.total} borrador(es)
                </p>
                <button
                  type="button"
                  onClick={draftsResource.refetch}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
                >
                  <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                  Actualizar
                </button>
              </div>
              <table className="hidden w-full text-left text-sm lg:table">
                <thead className="bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
                  <tr>
                    <th className="px-4 py-3">Caso</th>
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3">Documento</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Puntaje</th>
                    <th className="px-4 py-3">Revision</th>
                    <th className="px-4 py-3">Actualizado</th>
                    <th className="px-4 py-3">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-labora-ui">
                  {draftsResource.data.items.map((draft) => (
                    <tr key={draft.id}>
                      <td className="px-4 py-3 font-semibold text-labora-charcoal">
                        {draft.case_number}
                      </td>
                      <td className="px-4 py-3 text-labora-gray">{draft.user_name}</td>
                      <td className="px-4 py-3 text-labora-gray">
                        {legalActionTypeLabels[draft.action_type]}
                      </td>
                      <td className="px-4 py-3 text-labora-gray">
                        {draftStatusLabels[draft.status]}
                      </td>
                      <td className="px-4 py-3 text-labora-gray">
                        {draft.quality_score ?? "Sin puntaje"}
                      </td>
                      <td className="px-4 py-3 text-labora-gray">
                        {professionalReviewLabels[draft.professional_review_level]}
                      </td>
                      <td className="px-4 py-3 text-labora-gray">
                        {formatDateTime(draft.updated_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/legal-drafts/${draft.id}/review`}
                          className="font-semibold text-labora-deep hover:text-labora-green"
                        >
                          Revisar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid gap-3 p-4 lg:hidden">
                {draftsResource.data.items.map((draft) => (
                  <article key={draft.id} className="rounded-lg border border-labora-ui p-4">
                    <h2 className="font-semibold text-labora-charcoal">{draft.case_number}</h2>
                    <p className="mt-1 text-sm text-labora-gray">
                      {draft.user_name} · {legalActionTypeLabels[draft.action_type]}
                    </p>
                    <p className="mt-1 text-sm text-labora-gray">
                      {draftStatusLabels[draft.status]} · {formatDateTime(draft.updated_at)}
                    </p>
                    <Link
                      href={`/admin/legal-drafts/${draft.id}/review`}
                      className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-labora-green px-3 py-2 text-sm font-semibold text-white"
                    >
                      Revisar
                    </Link>
                  </article>
                ))}
              </div>

              {!draftsResource.data.items.length ? (
                <p className="p-5 text-sm text-labora-gray">
                  No hay borradores que coincidan con los filtros.
                </p>
              ) : null}
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
