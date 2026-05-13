"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  FolderOpen,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import type {
  CaseStatus,
  CaseTypeRequested,
} from "@/src/modules/cases/api/cases.types";
import { CaseCard } from "@/src/modules/cases/components/CaseCard";
import { useCases } from "@/src/modules/cases/hooks/useCases";
import { caseTypeLabels } from "@/src/modules/cases/utils/caseFormatters";
import { caseStatusMeta } from "@/src/modules/cases/utils/caseStatus";

function SkeletonList() {
  return (
    <div className="grid gap-4" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
          <div className="flex gap-4">
            <div className="h-12 w-12 animate-pulse rounded-xl bg-labora-ui" />
            <div className="flex-1">
              <div className="h-4 w-40 animate-pulse rounded bg-labora-ui" />
              <div className="mt-3 h-5 w-64 max-w-full animate-pulse rounded bg-labora-ui" />
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="h-10 animate-pulse rounded bg-labora-ui" />
                <div className="h-10 animate-pulse rounded bg-labora-ui" />
                <div className="h-10 animate-pulse rounded bg-labora-ui" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const statusOptions: Array<CaseStatus | "all"> = [
  "all",
  "draft",
  "created",
  "ready_for_documents",
  "documents_pending",
  "documents_uploaded",
  "preanalysis_ready",
  "preview_locked",
  "completed",
  "blocked",
];

const caseTypeOptions: Array<CaseTypeRequested | "all"> = [
  "all",
  "labor_history_analysis",
  "pension_liquidation_review",
  "pension_reliquidation",
  "missing_weeks_review",
  "teacher_magisterio_case",
  "special_regime_case",
  "administrative_claim",
  "lawsuit_draft_preparation",
  "not_sure",
];

export function CasesListPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CaseStatus | "all">("all");
  const [caseType, setCaseType] = useState<CaseTypeRequested | "all">("all");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const params = useMemo(
    () => ({
      page: 1,
      pageSize: 20,
      status,
      caseType,
      query: submittedQuery,
    }),
    [caseType, status, submittedQuery],
  );
  const { data, isLoading, error, refetch } = useCases(params);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query);
  }

  return (
    <section className="pb-20 md:pb-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-labora-green">
            Expediente digital
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-labora-charcoal">
            Mis expedientes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-labora-gray">
            Revisa tus carpetas digitales y continua el siguiente paso del analisis.
          </p>
        </div>
        <Link
          href="/app/cases/new"
          className="hidden min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep md:inline-flex"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Crear nuevo expediente
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-2xl border border-labora-ui bg-white p-4 shadow-panel"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-labora-charcoal">
          <SlidersHorizontal className="h-4 w-4 text-labora-green" aria-hidden="true" />
          Filtros
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px_260px_auto]">
          <label className="relative grid gap-2 text-sm font-semibold text-labora-charcoal">
            Busqueda
            <Search className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-labora-gray" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Caso, titular o documento"
              className="min-h-11 rounded-lg border border-labora-ui bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-green/15"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Estado
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as CaseStatus | "all")}
              className="min-h-11 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-green/15"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "Todos" : caseStatusMeta[option].label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Tipo de analisis
            <select
              value={caseType}
              onChange={(event) =>
                setCaseType(event.target.value as CaseTypeRequested | "all")
              }
              className="min-h-11 rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-green/15"
            >
              {caseTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "Todos" : caseTypeLabels[option]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="min-h-11 self-end rounded-lg border border-labora-ui bg-labora-ivory px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-white"
          >
            Aplicar
          </button>
        </div>
      </form>

      <div className="mt-6" aria-live="polite">
        {isLoading ? <SkeletonList /> : null}

        {!isLoading && error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-sm font-semibold">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </button>
          </div>
        ) : null}

        {!isLoading && !error && data?.items.length === 0 ? (
          <div className="rounded-2xl border border-labora-ui bg-white p-8 text-center shadow-panel">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-labora-ivory text-labora-green">
              <FolderOpen className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2 className="mt-5 font-heading text-2xl font-semibold text-labora-charcoal">
              Aun no tienes expedientes.
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-labora-gray">
              Crea tu primer caso para empezar la revision de tu historia laboral o
              situacion pensional.
            </p>
            <Link
              href="/app/cases/new"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white hover:bg-labora-deep"
            >
              Crear expediente
            </Link>
          </div>
        ) : null}

        {!isLoading && !error && data && data.items.length > 0 ? (
          <div className="grid gap-4">
            {data.items.map((laboraCase) => (
              <CaseCard key={laboraCase.id} laboraCase={laboraCase} />
            ))}
          </div>
        ) : null}
      </div>

      <Link
        href="/app/cases/new"
        className="fixed inset-x-4 bottom-4 z-20 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white shadow-panel md:hidden"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Crear expediente
      </Link>
    </section>
  );
}
