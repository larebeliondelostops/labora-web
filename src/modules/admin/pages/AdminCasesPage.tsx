"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  Ban,
  Edit3,
  Filter,
  FolderOpen,
  MoreHorizontal,
  NotebookPen,
  RefreshCcw,
  Search,
  Star,
  UserPlus,
} from "lucide-react";

import type {
  AdminCaseFilters,
  CasePriority,
  CaseQueueItem,
} from "@/src/modules/admin/api/admin.types";
import {
  useAdminCases,
  useAdminUsers,
  useAssignCase,
  useChangeCaseStatus,
  useCreateInternalNote,
} from "@/src/modules/admin/hooks/useAdmin";
import {
  AiConfidenceBadge,
  AssignCaseModal,
  ChangeCaseStatusModal,
  EmptyState,
  ErrorState,
  formatDateTime,
  InternalNoteDrawer,
  LoadingSkeleton,
  Panel,
  PaymentStatusChip,
  PriorityBadge,
  SectionHeader,
  SensitiveDataMask,
  StatusChip,
} from "@/src/modules/admin/components/admin-ui";

const statusOptions = [
  ["all", "Todos"],
  ["not_started", "No iniciado"],
  ["in_progress", "En proceso"],
  ["requires_review", "Requiere revision"],
  ["blocked", "Bloqueado"],
  ["completed", "Completado"],
  ["error", "Error"],
];

const priorityOptions: Array<[CasePriority | "all", string]> = [
  ["all", "Todas"],
  ["low", "Baja"],
  ["normal", "Normal"],
  ["high", "Alta"],
  ["urgent", "Urgente"],
];

function CaseQueueFilters({
  values,
  onSubmit,
}: {
  values: AdminCaseFilters;
  onSubmit: (filters: AdminCaseFilters) => void;
}) {
  const [query, setQuery] = useState(values.query || "");
  const [adminStatus, setAdminStatus] = useState(values.adminStatus || "all");
  const [stage, setStage] = useState(values.stage || "all");
  const [priority, setPriority] = useState(values.priority || "all");
  const [assignment, setAssignment] = useState(values.assignment || "all");
  const [paymentStatus, setPaymentStatus] = useState(values.paymentStatus || "all");
  const [documentStatus, setDocumentStatus] = useState(values.documentStatus || "all");
  const [lowConfidenceAi, setLowConfidenceAi] = useState(Boolean(values.lowConfidenceAi));
  const [blocked, setBlocked] = useState(Boolean(values.blocked));
  const [from, setFrom] = useState(values.from || "");
  const [to, setTo] = useState(values.to || "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      query,
      adminStatus,
      stage,
      priority,
      assignment,
      paymentStatus,
      documentStatus,
      lowConfidenceAi,
      blocked,
      from,
      to,
      page: 1,
      pageSize: 20,
    });
  }

  return (
    <Panel>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 text-sm font-semibold text-labora-charcoal">
          <Filter className="h-4 w-4 text-labora-green" aria-hidden="true" />
          Filtros
        </div>
        <div className="mt-4 grid gap-3 xl:grid-cols-[1.4fr_repeat(4,minmax(150px,1fr))]">
          <label className="relative grid gap-2 text-sm font-semibold text-labora-charcoal">
            Busqueda
            <Search className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-labora-gray" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Caso, titular, documento o correo"
              className="min-h-11 rounded-lg border border-labora-ui py-2 pl-9 pr-3 text-sm outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-green/15"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Estado
            <select value={adminStatus} onChange={(event) => setAdminStatus(event.target.value)} className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm">
              {statusOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Etapa
            <select value={stage} onChange={(event) => setStage(event.target.value)} className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm">
              <option value="all">Todas</option>
              <option value="documental">Documental</option>
              <option value="extraccion">Extraccion</option>
              <option value="juridica">Juridica</option>
              <option value="calculo">Calculo</option>
              <option value="informe">Informe</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Prioridad
            <select value={priority} onChange={(event) => setPriority(event.target.value)} className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm">
              {priorityOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Asignacion
            <select value={assignment} onChange={(event) => setAssignment(event.target.value as NonNullable<AdminCaseFilters["assignment"]>)} className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm">
              <option value="all">Todos</option>
              <option value="mine">Asignado a mi</option>
              <option value="unassigned">Sin asignar</option>
            </select>
          </label>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-5">
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Pago
            <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm">
              <option value="all">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="desbloqueo admin">Desbloqueo admin</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Documentos
            <select value={documentStatus} onChange={(event) => setDocumentStatus(event.target.value)} className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm">
              <option value="all">Todos</option>
              <option value="validado">Validado</option>
              <option value="OCR con alertas">OCR con alertas</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Desde
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Hasta
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="min-h-11 rounded-lg border border-labora-ui px-3 text-sm" />
          </label>
          <div className="grid gap-2 text-sm font-semibold text-labora-charcoal">
            Alertas
            <div className="flex min-h-11 items-center gap-3 rounded-lg border border-labora-ui px-3">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={lowConfidenceAi} onChange={(event) => setLowConfidenceAi(event.target.checked)} className="accent-labora-green" />
                Baja IA
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={blocked} onChange={(event) => setBlocked(event.target.checked)} className="accent-labora-green" />
                Bloqueado
              </label>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button type="submit" className="inline-flex min-h-11 items-center rounded-lg bg-labora-green px-5 text-sm font-semibold text-white hover:bg-labora-deep">
            Aplicar filtros
          </button>
        </div>
      </form>
    </Panel>
  );
}

function BulkActionsBar({ selected }: { selected: string[] }) {
  if (!selected.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-labora-green bg-emerald-50 p-3 text-sm text-emerald-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold">{selected.length} expediente(s) seleccionado(s)</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-3 font-semibold">
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Asignar
          </button>
          <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-3 font-semibold">
            <Star className="h-4 w-4" aria-hidden="true" />
            Prioridad
          </button>
        </div>
      </div>
    </div>
  );
}

function RowActions({
  item,
  onAssign,
  onStatus,
  onNote,
}: {
  item: CaseQueueItem;
  onAssign: (item: CaseQueueItem) => void;
  onStatus: (item: CaseQueueItem) => void;
  onNote: (item: CaseQueueItem) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/admin/cases/${item.caseId}/overview`} className="inline-flex min-h-9 items-center rounded-lg bg-labora-green px-3 text-xs font-semibold text-white hover:bg-labora-deep">
        Abrir
      </Link>
      <button type="button" onClick={() => onAssign(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-labora-ui text-labora-gray hover:bg-labora-ivory" title="Asignar">
        <UserPlus className="h-4 w-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={() => onStatus(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-labora-ui text-labora-gray hover:bg-labora-ivory" title="Cambiar estado">
        <Edit3 className="h-4 w-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={() => onNote(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-labora-ui text-labora-gray hover:bg-labora-ivory" title="Agregar nota">
        <NotebookPen className="h-4 w-4" aria-hidden="true" />
      </button>
      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-labora-ui text-labora-gray hover:bg-labora-ivory" title="Mas acciones">
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function CaseQueueTable({
  items,
  selected,
  onToggle,
  onAssign,
  onStatus,
  onNote,
}: {
  items: CaseQueueItem[];
  selected: string[];
  onToggle: (caseId: string) => void;
  onAssign: (item: CaseQueueItem) => void;
  onStatus: (item: CaseQueueItem) => void;
  onNote: (item: CaseQueueItem) => void;
}) {
  return (
    <Panel className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="hidden min-w-[1180px] w-full text-left text-sm lg:table">
          <thead className="bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
            <tr>
              <th className="px-4 py-3">
                <span className="sr-only">Seleccionar</span>
              </th>
              <th className="px-4 py-3">Caso</th>
              <th className="px-4 py-3">Titular</th>
              <th className="px-4 py-3">Etapa</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3">Documentos</th>
              <th className="px-4 py-3">IA</th>
              <th className="px-4 py-3">Asignado</th>
              <th className="px-4 py-3">SLA</th>
              <th className="px-4 py-3">Ultima actividad</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-labora-ui">
            {items.map((item) => (
              <tr key={item.caseId} className={item.hasBlockingIssue ? "bg-red-50/40" : "bg-white"}>
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.caseId)}
                    onChange={() => onToggle(item.caseId)}
                    className="accent-labora-green"
                  />
                </td>
                <td className="px-4 py-4">
                  <Link href={`/admin/cases/${item.caseId}/overview`} className="font-semibold text-labora-deep hover:text-labora-green">
                    {item.caseNumber}
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <p className="font-semibold text-labora-charcoal">{item.holderName}</p>
                  <SensitiveDataMask value={item.documentNumberMasked} />
                </td>
                <td className="px-4 py-4 text-labora-gray">{item.currentStage}</td>
                <td className="px-4 py-4"><StatusChip status={item.adminStatus} /></td>
                <td className="px-4 py-4"><PriorityBadge priority={item.priority} /></td>
                <td className="px-4 py-4"><PaymentStatusChip status={item.paymentStatus} /></td>
                <td className="px-4 py-4 text-labora-gray">{item.documentStatus || "Sin datos"}</td>
                <td className="px-4 py-4"><AiConfidenceBadge critical={item.hasBlockingIssue} score={item.hasLowConfidenceAi ? 0.58 : 0.91} /></td>
                <td className="px-4 py-4 text-labora-gray">{item.assignedTo?.name || "Sin asignar"}</td>
                <td className="px-4 py-4 text-labora-gray">{formatDateTime(item.slaDueAt)}</td>
                <td className="px-4 py-4 text-labora-gray">{formatDateTime(item.lastActivityAt)}</td>
                <td className="px-4 py-4">
                  <RowActions item={item} onAssign={onAssign} onStatus={onStatus} onNote={onNote} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 lg:hidden">
        {items.map((item) => (
          <CaseQueueMobileCard key={item.caseId} item={item} onAssign={onAssign} onStatus={onStatus} onNote={onNote} />
        ))}
      </div>
    </Panel>
  );
}

function CaseQueueMobileCard({
  item,
  onAssign,
  onStatus,
  onNote,
}: {
  item: CaseQueueItem;
  onAssign: (item: CaseQueueItem) => void;
  onStatus: (item: CaseQueueItem) => void;
  onNote: (item: CaseQueueItem) => void;
}) {
  return (
    <article className="rounded-lg border border-labora-ui bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-labora-deep">{item.caseNumber}</p>
          <h2 className="mt-1 font-heading text-lg font-semibold text-labora-charcoal">{item.holderName}</h2>
          <p className="mt-1 text-sm text-labora-gray">{item.currentStage}</p>
        </div>
        <PriorityBadge priority={item.priority} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <StatusChip status={item.adminStatus} />
        <PaymentStatusChip status={item.paymentStatus} />
        <AiConfidenceBadge critical={item.hasBlockingIssue} score={item.hasLowConfidenceAi ? 0.58 : 0.91} />
      </div>
      <p className="mt-3 text-sm text-labora-gray">
        Asignado: {item.assignedTo?.name || "Sin asignar"} - SLA {formatDateTime(item.slaDueAt)}
      </p>
      <div className="mt-4">
        <RowActions item={item} onAssign={onAssign} onStatus={onStatus} onNote={onNote} />
      </div>
    </article>
  );
}

export function AdminCasesPage({ initialFilters = {} }: { initialFilters?: AdminCaseFilters }) {
  const [filters, setFilters] = useState<AdminCaseFilters>({
    page: 1,
    pageSize: 20,
    assignment: "all",
    ...initialFilters,
  });
  const resource = useAdminCases(useMemo(() => filters, [filters]));
  const users = useAdminUsers();
  const [selected, setSelected] = useState<string[]>([]);
  const [activeCase, setActiveCase] = useState<CaseQueueItem | null>(null);
  const [drawer, setDrawer] = useState<"assign" | "status" | "note" | null>(null);
  const activeCaseId = activeCase?.caseId || "case-1001";
  const assign = useAssignCase(activeCaseId);
  const status = useChangeCaseStatus(activeCaseId);
  const note = useCreateInternalNote(activeCaseId);

  function toggleSelected(caseId: string) {
    setSelected((current) =>
      current.includes(caseId)
        ? current.filter((item) => item !== caseId)
        : [...current, caseId],
    );
  }

  function openDrawer(nextDrawer: "assign" | "status" | "note", item: CaseQueueItem) {
    setActiveCase(item);
    setDrawer(nextDrawer);
  }

  const items = resource.data?.items || [];

  return (
    <div className="grid gap-5">
      <SectionHeader
        eyebrow="Backoffice"
        title="Cola de expedientes"
        body="Busqueda, priorizacion, asignaciones y acciones rapidas sobre expedientes administrativos."
        actions={
          <button type="button" onClick={resource.refetch} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-labora-ui px-3 text-sm font-semibold text-labora-deep hover:bg-labora-ivory">
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Actualizar
          </button>
        }
      />

      <CaseQueueFilters values={filters} onSubmit={setFilters} />
      <BulkActionsBar selected={selected} />

      {resource.isLoading ? <LoadingSkeleton rows={3} /> : null}

      {!resource.isLoading && resource.error ? (
        <ErrorState message={resource.error} onRetry={resource.refetch} />
      ) : null}

      {!resource.isLoading && !resource.error && !items.length ? (
        <EmptyState
          title="No hay expedientes que coincidan"
          body="Ajusta filtros o revisa mas tarde."
          action={
            <button type="button" onClick={() => setFilters({ page: 1, pageSize: 20, assignment: "all" })} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-labora-green px-4 text-sm font-semibold text-white">
              <FolderOpen className="h-4 w-4" aria-hidden="true" />
              Limpiar filtros
            </button>
          }
        />
      ) : null}

      {!resource.isLoading && !resource.error && items.length ? (
        <CaseQueueTable
          items={items}
          selected={selected}
          onToggle={toggleSelected}
          onAssign={(item) => openDrawer("assign", item)}
          onStatus={(item) => openDrawer("status", item)}
          onNote={(item) => openDrawer("note", item)}
        />
      ) : null}

      <AssignCaseModal
        open={drawer === "assign"}
        users={users.data || []}
        isLoading={assign.isLoading}
        error={assign.error}
        result={assign.lastResult}
        onClose={() => setDrawer(null)}
        onSubmit={assign.run}
      />
      <ChangeCaseStatusModal
        open={drawer === "status"}
        isLoading={status.isLoading}
        error={status.error}
        result={status.lastResult}
        onClose={() => setDrawer(null)}
        onSubmit={status.run}
      />
      <InternalNoteDrawer
        open={drawer === "note"}
        isLoading={note.isLoading}
        error={note.error}
        result={note.lastResult}
        onClose={() => setDrawer(null)}
        onSubmit={note.run}
      />
      <div className="hidden">
        <Ban aria-hidden="true" />
      </div>
    </div>
  );
}
