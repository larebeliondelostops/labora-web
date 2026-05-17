"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Info, LockKeyhole } from "lucide-react";

import {
  CompletionScoreCard,
  FreeVsPaidComparison,
  LimitedSummaryCard,
  LockedFeatureList,
  LockedReportPreview,
  PaywallCTA,
  PreviewEthicalDisclaimer,
  PreviewHeader,
  PreviewStateView,
} from "@/src/modules/paywall-preview/components/preview-components";
import { useConversionEvents } from "@/src/modules/paywall-preview/hooks/useConversionEvents";
import { usePreview } from "@/src/modules/paywall-preview/hooks/usePreview";
import type { LockedFeature } from "@/src/modules/paywall-preview/api/preview.types";

function toFeatureKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getAnalysisHref(caseId: string) {
  return `/app/cases/${caseId}/full-analysis`;
}

export function PreviewPage({ caseId }: { caseId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preview = usePreview(caseId);
  const { track } = useConversionEvents(caseId);
  const [featureHint, setFeatureHint] = useState<string | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const paywallViewed = useRef(false);
  const checkoutReturnHandled = useRef(false);

  const data = preview.data;
  const hasReturnedFromPayment = searchParams.get("payment") === "return";

  useEffect(() => {
    if (!preview.error) {
      return;
    }

    const next = encodeURIComponent(`/app/cases/${caseId}/preview`);

    if (preview.error.status === 401) {
      router.replace(`/auth/login?next=${next}`);
      return;
    }

    if (preview.error.status === 409 && preview.error.code === "CONSENT_REQUIRED") {
      router.replace("/app/consentimientos");
      return;
    }

    if (
      preview.error.status === 409 &&
      (preview.error.code === "PREANALYSIS_REQUIRED" ||
        preview.error.code === "PRE_ANALYSIS_REQUIRED")
    ) {
      router.replace(`/app/cases/${caseId}/pre-analysis`);
    }
  }, [caseId, preview.error, router]);

  useEffect(() => {
    if (!hasReturnedFromPayment || checkoutReturnHandled.current) {
      return;
    }

    checkoutReturnHandled.current = true;
    track("checkout_returned", {
      route: `/app/cases/${caseId}/preview`,
      isUnlocked: data?.isUnlocked ?? false,
    });
    preview.refreshPaywall();
    preview.refetch();
  }, [caseId, data?.isUnlocked, hasReturnedFromPayment, preview, track]);

  useEffect(() => {
    if (
      !data ||
      paywallViewed.current ||
      data.status !== "completed" ||
      data.isUnlocked ||
      data.cta.target !== "checkout"
    ) {
      return;
    }

    paywallViewed.current = true;
    track("paywall_viewed", {
      route: `/app/cases/${caseId}/preview`,
      previewId: data.previewId,
      isUnlocked: data.isUnlocked,
    });
  }, [caseId, data, track]);

  function scrollToCta() {
    ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleCtaClick() {
    if (!data) {
      return;
    }

    if (data.isUnlocked || data.cta.target === "analysis") {
      router.push(getAnalysisHref(caseId));
      return;
    }

    if (data.cta.target === "review" || data.summary.requiresHumanReview) {
      return;
    }

    await track("preview_cta_clicked", {
      placement: "main_cta",
      route: `/app/cases/${caseId}/preview`,
      isUnlocked: data.isUnlocked,
    });
    await track("checkout_started", {
      source: "preview_paywall",
      route: `/app/cases/${caseId}/preview`,
    });

    router.push(`/app/cases/${caseId}/checkout`);
  }

  async function handleFeatureClick(feature: LockedFeature) {
    setFeatureHint("Este entregable se desbloquea con el analisis completo.");
    scrollToCta();
    await track("locked_feature_clicked", {
      featureKey: feature.key,
      placement: "locked_feature_list",
      route: `/app/cases/${caseId}/preview`,
    });
  }

  async function handleLockedSectionClick(section: string) {
    setFeatureHint("Esta seccion se desbloquea con el analisis completo.");
    scrollToCta();
    await track("locked_feature_clicked", {
      featureKey: toFeatureKey(section),
      placement: "locked_report_preview",
      route: `/app/cases/${caseId}/preview`,
    });
  }

  if (preview.isLoading) {
    return <PreviewStateView state="loading" caseId={caseId} />;
  }

  if (preview.error) {
    return (
      <PreviewStateView
        state="error"
        caseId={caseId}
        message={preview.error.message}
        code={preview.error.code}
        onRetry={preview.refetch}
      />
    );
  }

  if (!data) {
    return (
      <PreviewStateView
        state="not_started"
        caseId={caseId}
        onRetry={() =>
          preview.createOrRefresh({ forceRefresh: false, reason: "user_request" })
        }
      />
    );
  }

  if (data.isUnlocked || data.cta.target === "analysis") {
    return <PreviewStateView state="unlocked" caseId={caseId} />;
  }

  if (data.cta.target === "review" || data.summary.requiresHumanReview) {
    return (
      <section className="space-y-5">
        <PreviewStateView state="requires_review" caseId={caseId} />
        <PreviewEthicalDisclaimer />
      </section>
    );
  }

  if (data.status === "not_started") {
    return (
      <PreviewStateView
        state="not_started"
        caseId={caseId}
        message={data.statusMessage}
        onRetry={() =>
          preview.createOrRefresh({ forceRefresh: false, reason: "user_request" })
        }
      />
    );
  }

  if (data.status === "in_progress") {
    return (
      <PreviewStateView
        state="in_progress"
        caseId={caseId}
        isRefreshing={preview.isRefreshing}
      />
    );
  }

  if (data.status === "requires_review") {
    return (
      <section className="space-y-5">
        <PreviewStateView state="requires_review" caseId={caseId} />
        <PreviewEthicalDisclaimer />
      </section>
    );
  }

  if (data.status === "blocked") {
    return (
      <PreviewStateView
        state="blocked"
        caseId={caseId}
        message={data.statusMessage}
        code={data.blockedReason}
      />
    );
  }

  if (data.status === "error") {
    return (
      <PreviewStateView
        state="error"
        caseId={caseId}
        message={data.statusMessage}
        onRetry={preview.refetch}
      />
    );
  }

  return (
    <section className="space-y-5 pb-36 md:pb-0">
      <PreviewHeader
        caseId={data.caseId || caseId}
        title="Tu vista previa esta lista"
        status={data.status}
        isUnlocked={data.isUnlocked}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <LimitedSummaryCard
            title={data.summary.title}
            limitedText={data.summary.limitedText}
            mainFindingTeaser={data.summary.mainFindingTeaser}
            hiddenValueHint={data.summary.hiddenValueHint}
            alertLevel={data.summary.alertLevel}
            confidenceScore={data.summary.confidenceScore}
            requiresHumanReview={data.summary.requiresHumanReview}
          />

          <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <div className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
                  Alertas generales
                </p>
                <h2 className="mt-1 font-heading text-xl font-semibold text-labora-charcoal">
                  Senales preliminares, sin conclusion definitiva
                </h2>
                <p className="mt-2 text-sm leading-6 text-labora-gray">
                  La vista previa muestra indicios limitados para orientar tu
                  decision. El detalle tecnico, calculos y fundamentos se
                  mantienen bloqueados hasta completar el pago.
                </p>
              </div>
            </div>
          </section>

          {data.warnings.length ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900 shadow-panel">
              <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                Advertencias
              </h2>
              <ul className="mt-3 grid gap-2">
                {data.warnings.map((warning) => (
                  <li key={`${warning.code || "warning"}-${warning.message}`} className="flex gap-2">
                    <AlertCircle className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                    {warning.message}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <CompletionScoreCard
            completionScore={data.summary.completionScore}
            missingItems={data.summary.missingItems}
          />

          <LockedReportPreview
            sections={data.lockedContent.blurredSections}
            isUnlocked={data.isUnlocked}
            onSectionClick={handleLockedSectionClick}
          />

          <LockedFeatureList
            features={data.lockedContent.features}
            onFeatureClick={handleFeatureClick}
          />

          <FreeVsPaidComparison
            free={data.comparison.free}
            paid={data.comparison.paid}
            onViewed={() =>
              track("comparison_viewed", {
                route: `/app/cases/${caseId}/preview`,
                previewId: data.previewId,
              })
            }
          />

          <PreviewEthicalDisclaimer />
        </div>

        <aside ref={ctaRef} className="space-y-4">
          {featureHint ? (
            <div
              aria-live="polite"
              className="rounded-2xl border border-labora-mint bg-labora-mint/15 p-4 text-sm leading-6 text-labora-deep"
            >
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <p>{featureHint}</p>
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <div className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-labora-ivory text-labora-green">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                  Que recibes al pagar
                </h2>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-labora-gray">
                  {data.lockedContent.features.slice(0, 4).map((feature) => (
                    <li key={feature.key}>{feature.title}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <PaywallCTA
            label={data.cta.label}
            priceLabel={data.cta.priceLabel}
            disclaimer={data.cta.disclaimer}
            isLoading={false}
            onClick={handleCtaClick}
          />
        </aside>
      </div>
    </section>
  );
}
