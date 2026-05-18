"use client";

import Link from "next/link";
import { ArrowLeft, History, Loader2 } from "lucide-react";

import { InlineAlert } from "@/components/auth/FormFeedback";
import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import { CaseReportsNavigation } from "@/src/modules/reports/components/CaseReportsNavigation";
import {
  DeliveryErrorState,
  DeliveryLoadingSkeleton,
  DeliveryTimeline,
} from "@/src/modules/delivery/components/delivery-components";
import { useDeliveryEvents } from "@/src/modules/delivery/hooks/useDelivery";

export function DeliveryTimelinePage({ caseId }: { caseId: string }) {
  const caseDetail = useCaseDetail(caseId);
  const events = useDeliveryEvents(caseId);

  if (caseDetail.isLoading || events.isLoading) {
    return <DeliveryLoadingSkeleton />;
  }

  if (events.error && !events.data.items.length) {
    return <DeliveryErrorState message={events.error} onRetry={events.refetch} />;
  }

  return (
    <section className="space-y-5 pb-20 md:pb-0">
      {caseDetail.data ? (
        <CaseHeader
          caseNumber={caseDetail.data.caseNumber}
          status={caseDetail.data.status}
          holderFullName={getHolderFullName(caseDetail.data.holder)}
          updatedAt={caseDetail.data.updatedAt}
        />
      ) : null}

      <CaseReportsNavigation caseId={caseId} active="Entrega final" />

      <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <Link
          href={`/app/cases/${caseId}/delivery`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep hover:text-labora-green"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a entrega final
        </Link>
        <div className="mt-3 flex gap-3">
          <History className="mt-1 h-5 w-5 shrink-0 text-labora-deep" aria-hidden="true" />
          <div>
            <h1 className="font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
              Timeline de entrega
            </h1>
            <p className="mt-2 text-sm leading-6 text-labora-gray">
              Trazabilidad visible de documentos, descargas, links compartidos y cierre del caso.
            </p>
          </div>
        </div>
      </header>

      {events.error ? <InlineAlert tone="warning">{events.error}</InlineAlert> : null}

      <DeliveryTimeline events={events.data.items} />

      {events.data.nextCursor ? (
        <button
          type="button"
          onClick={events.loadMore}
          disabled={events.isRefreshing}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-labora-ui bg-white px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory disabled:cursor-not-allowed disabled:text-labora-gray"
        >
          {events.isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          Cargar mas eventos
        </button>
      ) : null}
    </section>
  );
}
