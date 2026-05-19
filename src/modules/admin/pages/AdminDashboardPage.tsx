"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCcw,
} from "lucide-react";

import { useAdminDashboard } from "@/src/modules/admin/hooks/useAdmin";
import {
  AiConfidenceBadge,
  EmptyState,
  ErrorState,
  formatDateTime,
  LinkButton,
  LoadingSkeleton,
  Panel,
  Pill,
  SectionHeader,
} from "@/src/modules/admin/components/admin-ui";
import type { DashboardMetric } from "@/src/modules/admin/api/admin.types";

const metricIcon = {
  green: <CheckCircle2 className="h-5 w-5" aria-hidden="true" />,
  amber: <Clock className="h-5 w-5" aria-hidden="true" />,
  red: <AlertTriangle className="h-5 w-5" aria-hidden="true" />,
  blue: <RefreshCcw className="h-5 w-5" aria-hidden="true" />,
  gray: <Clock className="h-5 w-5" aria-hidden="true" />,
};

function DashboardMetricCard({ metric }: { metric: DashboardMetric }) {
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between gap-3">
        <Pill tone={metric.tone}>{metricIcon[metric.tone]}</Pill>
        {metric.delta ? <span className="text-xs font-semibold text-labora-gray">{metric.delta}</span> : null}
      </div>
      <p className="mt-5 text-sm font-semibold text-labora-gray">{metric.label}</p>
      <p className="mt-1 font-heading text-3xl font-semibold text-labora-charcoal">{metric.value}</p>
    </Panel>
  );
}

export function AdminDashboardPage() {
  const dashboard = useAdminDashboard();
  const data = dashboard.data;

  if (dashboard.isLoading) {
    return <LoadingSkeleton rows={4} />;
  }

  if (dashboard.error || !data) {
    return <ErrorState message={dashboard.error || "No hay datos administrativos."} onRetry={dashboard.refetch} />;
  }

  const totalByStage = data.casesByStage.reduce((sum, item) => sum + item.total, 0) || 1;

  return (
    <div className="grid gap-5">
      <SectionHeader
        eyebrow="Operacion"
        title="Dashboard administrativo"
        body="Vista ejecutiva de expedientes, revisiones, alertas y actividad operativa."
        actions={<LinkButton href="/admin/cases">Abrir cola</LinkButton>}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {data.metrics.map((metric) => (
          <DashboardMetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-5">
          <Panel>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-xl font-semibold text-labora-charcoal">Casos por etapa</h2>
              <Pill tone="blue">{totalByStage} activos</Pill>
            </div>
            <div className="mt-5 grid gap-4">
              {data.casesByStage.map((stage) => {
                const percentage = Math.round((stage.total / totalByStage) * 100);

                return (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-labora-charcoal">{stage.label}</span>
                      <span className="text-labora-gray">
                        {stage.total} casos - {stage.blocked} bloqueados
                      </span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-labora-ivory">
                      <div className="h-full rounded-full bg-labora-green" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel>
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">Colas de revision</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {data.reviewQueue.map((queue) => (
                <Link
                  key={queue.id}
                  href={queue.href}
                  className="rounded-lg border border-labora-ui bg-labora-ivory p-4 transition hover:border-labora-green hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-labora-charcoal">{queue.label}</p>
                    <Pill tone={queue.tone}>{queue.count}</Pill>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-labora-deep">
                    Revisar
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel>
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">Actividad reciente</h2>
            {data.recentActivity.length ? (
              <div className="mt-4 grid gap-3">
                {data.recentActivity.map((activity) => (
                  <Link
                    key={activity.id}
                    href={`/admin/cases/${activity.caseId}/overview`}
                    className="rounded-lg border border-labora-ui p-4 transition hover:bg-labora-ivory"
                  >
                    <p className="text-sm font-semibold text-labora-charcoal">
                      {activity.caseNumber} - {activity.actor}
                    </p>
                    <p className="mt-1 text-sm text-labora-gray">{activity.action}</p>
                    <p className="mt-2 text-xs font-semibold text-labora-gray">{formatDateTime(activity.occurredAt)}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="No hay actividad pendiente" />
            )}
          </Panel>
        </div>

        <aside className="grid gap-5" id="alertas">
          <Panel>
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">SLA vencidos o proximos</h2>
            <div className="mt-4 grid gap-3">
              {data.slaAlerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={`/admin/cases/${alert.caseId}/overview`}
                  className="rounded-lg border border-labora-ui p-4 transition hover:bg-labora-ivory"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-labora-charcoal">{alert.title}</p>
                      <p className="mt-1 text-xs text-labora-gray">{alert.caseNumber}</p>
                    </div>
                    <Pill tone={alert.severity === "critical" ? "red" : "amber"}>{alert.severity}</Pill>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-labora-gray">Vence {formatDateTime(alert.dueAt)}</p>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel>
            <h2 className="font-heading text-xl font-semibold text-labora-charcoal">Alertas IA criticas</h2>
            <div className="mt-4 grid gap-3">
              {data.lowConfidenceAlerts.map((alert) => (
                <article key={alert.id} className="rounded-lg border border-labora-ui p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-labora-charcoal">{alert.title}</p>
                    <AiConfidenceBadge score={alert.confidenceScore} critical={alert.severity === "critical"} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-labora-gray">{alert.description}</p>
                  <p className="mt-2 text-xs font-semibold text-labora-gray">{alert.source}</p>
                </article>
              ))}
            </div>
          </Panel>
        </aside>
      </section>
    </div>
  );
}
