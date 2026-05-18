"use client";

import { useMemo, useState } from "react";
import { Filter, RefreshCcw } from "lucide-react";

import { InlineAlert } from "@/components/auth/FormFeedback";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import {
  ReviewEmptyState,
  ReviewInboxTable,
  ReviewSkeleton,
  reviewPriorityCopy,
  reviewStatusCopy,
  reviewTypeCopy,
} from "@/src/modules/professional-review/components/professional-review-components";
import { useProfessionalReviews } from "@/src/modules/professional-review/hooks/useProfessionalReviews";
import type {
  ReviewFilters,
  ReviewPriority,
  ReviewType,
} from "@/src/modules/professional-review/api/professional-review.types";

const statuses = [
  "all",
  "payment_pending",
  "requested",
  "queued",
  "assigned",
  "in_review",
  "client_action_required",
  "ready_for_approval",
  "completed",
  "blocked",
  "rejected",
] as const;

const priorities: Array<ReviewPriority | "all"> = ["all", "low", "normal", "high", "urgent"];
const reviewTypes: Array<ReviewType | "all"> = [
  "all",
  "report_review",
  "legal_draft_review",
  "lawsuit_draft_review",
  "claim_review",
  "petition_review",
  "calculation_review",
  "full_case_review",
];

export function ProfessionalReviewsInboxPage() {
  const [status, setStatus] = useState<(typeof statuses)[number]>("all");
  const [priority, setPriority] = useState<ReviewPriority | "all">("all");
  const [reviewType, setReviewType] = useState<ReviewType | "all">("all");
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filters = useMemo<ReviewFilters>(
    () => ({
      status,
      priority,
      reviewType,
      assignedToMe,
      search,
      dateFrom,
      dateTo,
      pageSize: 30,
    }),
    [assignedToMe, dateFrom, dateTo, priority, reviewType, search, status],
  );

  const reviews = useProfessionalReviews(filters);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <AdminSidebar />
        <section className="space-y-5">
          <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
              Backoffice
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-labora-charcoal">
              Revisiones profesionales
            </h1>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              Bandeja operativa para gestionar solicitudes, comentarios, archivos revisados y aprobaciones.
            </p>
          </header>

          <section className="rounded-2xl border border-labora-ui bg-white p-4 shadow-panel">
            <div className="flex items-center gap-2 text-sm font-semibold text-labora-charcoal">
              <Filter className="h-4 w-4 text-labora-green" aria-hidden="true" />
              Filtros
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              <label className="block">
                <span className="text-xs font-semibold text-labora-gray">Estado</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as typeof status)}
                  className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm"
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item === "all" ? "Todos" : reviewStatusCopy[item].label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-labora-gray">Prioridad</span>
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as ReviewPriority | "all")}
                  className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm"
                >
                  {priorities.map((item) => (
                    <option key={item} value={item}>
                      {item === "all" ? "Todas" : reviewPriorityCopy[item]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-labora-gray">Tipo</span>
                <select
                  value={reviewType}
                  onChange={(event) => setReviewType(event.target.value as ReviewType | "all")}
                  className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm"
                >
                  {reviewTypes.map((item) => (
                    <option key={item} value={item}>
                      {item === "all" ? "Todos" : reviewTypeCopy[item]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-labora-gray">Desde</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui px-3 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-labora-gray">Hasta</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui px-3 text-sm"
                />
              </label>

              <label className="mt-7 flex items-center gap-2 text-sm text-labora-gray">
                <input
                  type="checkbox"
                  checked={assignedToMe}
                  onChange={(event) => setAssignedToMe(event.target.checked)}
                  className="h-4 w-4 accent-labora-green"
                />
                Asignadas a mi
              </label>
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-semibold text-labora-gray">
                Buscar por caso, cliente o documento
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui px-3 text-sm"
                placeholder="Buscar revision"
              />
            </label>
          </section>

          {reviews.error ? <InlineAlert tone="error">{reviews.error}</InlineAlert> : null}

          <div className="flex flex-col gap-3 rounded-2xl border border-labora-ui bg-white p-4 shadow-panel sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-labora-charcoal">
              {reviews.data.pagination.total || reviews.data.items.length} revision(es)
            </p>
            <button
              type="button"
              onClick={reviews.refetch}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-labora-ui px-3 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Actualizar
            </button>
          </div>

          {reviews.isLoading ? <ReviewSkeleton /> : null}

          {!reviews.isLoading && reviews.data.items.length ? (
            <ReviewInboxTable items={reviews.data.items} />
          ) : null}

          {!reviews.isLoading && !reviews.data.items.length ? (
            <ReviewEmptyState
              title={assignedToMe ? "No tienes revisiones asignadas por ahora." : "No hay revisiones para estos filtros."}
              message={
                assignedToMe
                  ? "Cuando un administrador te asigne una revision, aparecera aqui."
                  : "Ajusta filtros o busqueda para encontrar solicitudes."
              }
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}
