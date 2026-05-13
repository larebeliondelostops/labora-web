"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

import { FormErrorSummary, InlineAlert } from "@/components/auth/FormFeedback";
import { ConsentBlockedState } from "@/components/consents/ConsentBlockedState";
import { ConsentCheckboxCard } from "@/components/consents/ConsentCheckboxCard";
import { ConsentStepper } from "@/components/consents/ConsentStepper";
import { ConsentSummaryPanel } from "@/components/consents/ConsentSummaryPanel";
import { LegalDocumentViewer } from "@/components/consents/LegalDocumentViewer";
import {
  emitConsentEvent,
  formatConsentDate,
  getConsentDescription,
  getConsentTypeLabel,
} from "@/lib/consent-content";
import { getApiErrorMessage } from "@/lib/auth-errors";
import {
  getConsentStatus,
  getCurrentLegalDocuments,
  submitConsents,
} from "@/services/consent.service";
import type {
  ConsentComplianceStatus,
  ConsentStatusResponse,
  ConsentType,
  LegalDocument,
} from "@/types/consent";

interface ConsentPageProps {
  nextUrl?: string;
  mode?: "onboarding" | "profile" | "blocking";
}

const emptyStatus: ConsentStatusResponse = {
  status: "not_started",
  canUploadDocuments: false,
  requiredConsentTypes: [],
  acceptedConsentTypes: [],
  missingConsentTypes: [],
};

function ConsentSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-4">
        {[1, 2, 3].map((item) => (
          <div key={item} className="rounded-2xl border border-labora-ui bg-white p-5">
            <div className="h-5 w-56 animate-pulse rounded bg-labora-ui" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-labora-ui" />
            <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-labora-ui" />
            <div className="mt-5 h-10 w-44 animate-pulse rounded bg-labora-ui" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-labora-ui bg-white p-5">
        <div className="h-6 w-32 animate-pulse rounded bg-labora-ui" />
        <div className="mt-5 h-16 animate-pulse rounded bg-labora-ui" />
        <div className="mt-5 h-11 animate-pulse rounded bg-labora-ui" />
      </div>
    </div>
  );
}

function getRequiredDocuments(documents: LegalDocument[]) {
  return documents.filter((document) => document.isRequired);
}

function getMissingTypes(documents: LegalDocument[], checked: Record<string, boolean>) {
  return getRequiredDocuments(documents)
    .filter((document) => !checked[document.id])
    .map((document) => document.type);
}

function getCheckedFromStatus(
  documents: LegalDocument[],
  status: ConsentStatusResponse,
) {
  const acceptedTypes = new Set(status.acceptedConsentTypes || []);
  const isAlreadyComplete = status.status === "completed" || status.canUploadDocuments;

  return documents.reduce<Record<string, boolean>>((nextChecked, document) => {
    nextChecked[document.id] =
      acceptedTypes.has(document.type) || (isAlreadyComplete && document.isRequired);
    return nextChecked;
  }, {});
}

function getStatusFromSelection(
  documents: LegalDocument[],
  checked: Record<string, boolean>,
  backendStatus: ConsentComplianceStatus,
): ConsentComplianceStatus {
  if (backendStatus === "blocked" || backendStatus === "requires_review" || backendStatus === "error") {
    return backendStatus;
  }

  const required = getRequiredDocuments(documents);
  const selected = required.filter((document) => checked[document.id]).length;

  if (required.length > 0 && selected === required.length) {
    return "completed";
  }

  if (selected > 0) {
    return "in_progress";
  }

  return backendStatus === "completed" ? "completed" : "not_started";
}

export function ConsentPage({ nextUrl = "/app/cases/new", mode = "onboarding" }: ConsentPageProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [status, setStatus] = useState<ConsentStatusResponse>(emptyStatus);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedDocument =
    documents.find((document) => document.id === selectedDocumentId) || documents[0];
  const requiredDocuments = useMemo(() => getRequiredDocuments(documents), [documents]);
  const acceptedRequiredCount = requiredDocuments.filter((document) => checked[document.id]).length;
  const missingConsentTypes = useMemo(
    () => getMissingTypes(documents, checked),
    [checked, documents],
  );
  const hasCompletedConsents = status.status === "completed" || status.canUploadDocuments;
  const visualStatus = getStatusFromSelection(documents, checked, status.status);
  const allRequiredSelected =
    requiredDocuments.length > 0 && acceptedRequiredCount === requiredDocuments.length;
  const canSubmit =
    (hasCompletedConsents || allRequiredSelected) &&
    !isLoading &&
    !isSubmitting &&
    status.status !== "requires_review" &&
    status.status !== "blocked";

  const load = async () => {
    setIsLoading(true);
    setLoadError(null);
    setSubmitError(null);

    try {
      const [nextDocuments, nextStatus] = await Promise.all([
        getCurrentLegalDocuments(),
        getConsentStatus(),
      ]);

      setDocuments(nextDocuments);
      setStatus(nextStatus);
      setSelectedDocumentId(nextDocuments[0]?.id || null);
      setChecked(getCheckedFromStatus(nextDocuments, nextStatus));
      setShowMissing(false);
    } catch (error) {
      setLoadError(
        getApiErrorMessage(
          error,
          "No pudimos cargar los consentimientos. Revisa tu conexion e intenta nuevamente.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    emitConsentEvent("consents_page_viewed", { mode });
    load();
  }, [mode]);

  useEffect(() => {
    if (!isDocumentViewerOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDocumentViewerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDocumentViewerOpen]);

  const handleCheck = (document: LegalDocument, value: boolean) => {
    setChecked((current) => ({ ...current, [document.id]: value }));
    emitConsentEvent(value ? "consent_checkbox_checked" : "consent_checkbox_unchecked", {
      consentType: document.type,
    });
  };

  const handleOpenDocument = (document: LegalDocument) => {
    setSelectedDocumentId(document.id);
    setIsDocumentViewerOpen(true);
    emitConsentEvent("legal_document_opened", {
      consentType: document.type,
      version: document.version,
    });
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setShowMissing(true);
    emitConsentEvent("consents_submit_clicked");

    if (hasCompletedConsents) {
      emitConsentEvent("consents_submit_succeeded", {
        status: status.status,
      });
      router.push(nextUrl);
      return;
    }

    if (!allRequiredSelected) {
      setSubmitError("Aun faltan autorizaciones obligatorias para continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await submitConsents({
        items: documents
          .filter((document) => checked[document.id])
          .map((document) => ({
            legalDocumentId: document.id,
            consentType: document.type,
            accepted: true,
          })),
        source:
          typeof window !== "undefined" && window.innerWidth < 768 ? "mobile_web" : "web",
        locale: "es-CO",
      });

      const nextStatus = await getConsentStatus();
      setStatus(nextStatus);
      emitConsentEvent("consents_submit_succeeded", {
        status: response.status || nextStatus.status,
      });

      if (nextStatus.status === "completed" || nextStatus.canUploadDocuments) {
        const params = new URLSearchParams();
        params.set("next", nextUrl);
        params.set("acceptedAt", response.acceptedAt || nextStatus.lastAcceptedAt || new Date().toISOString());
        router.push(`/app/onboarding/consentimientos/exito?${params.toString()}`);
        return;
      }

      setSubmitError("El backend aun reporta autorizaciones pendientes.");
    } catch (error) {
      emitConsentEvent("consents_submit_failed");
      setSubmitError(
        getApiErrorMessage(
          error,
          "No pudimos guardar tus autorizaciones. Intenta nuevamente.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6">
        {mode === "onboarding" ? <ConsentStepper /> : null}
        <ConsentSkeleton />
      </div>
    );
  }

  if (loadError) {
    return (
      <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
        <AlertTriangle className="h-8 w-8 text-amber-600" />
        <h1 className="mt-4 font-heading text-2xl font-semibold text-labora-charcoal">
          No pudimos cargar los consentimientos
        </h1>
        <p className="mt-2 text-sm leading-6 text-labora-gray">{loadError}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={load}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white hover:bg-labora-deep"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
          <button
            type="button"
            onClick={() => router.push("/app/dashboard")}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep hover:bg-labora-ivory"
          >
            Volver al panel
          </button>
        </div>
      </section>
    );
  }

  if (!documents.length) {
    return (
      <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
        <h1 className="font-heading text-2xl font-semibold text-labora-charcoal">
          No encontramos documentos legales vigentes
        </h1>
        <p className="mt-2 text-sm leading-6 text-labora-gray">
          Intenta de nuevo o contacta soporte antes de cargar documentos.
        </p>
        <button
          type="button"
          onClick={load}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white hover:bg-labora-deep"
        >
          Reintentar
        </button>
      </section>
    );
  }

  if (mode === "blocking" && status.status !== "completed") {
    return <ConsentBlockedState missingConsentTypes={status.missingConsentTypes} />;
  }

  return (
    <div className="grid gap-6">
      {mode === "onboarding" ? <ConsentStepper /> : null}

      <section className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-labora-green">
          Cumplimiento
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-labora-charcoal">
          Consentimientos y autorizaciones
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-labora-gray">
          Antes de cargar tu historia laboral o documentos pensionales, necesitamos tu
          autorizacion expresa para tratar la informacion requerida en tu expediente.
        </p>
        {status.status === "completed" ? (
          <InlineAlert tone="success">
            Tus autorizaciones vigentes ya estan completas
            {status.lastAcceptedAt ? ` desde ${formatConsentDate(status.lastAcceptedAt)}` : ""}.
          </InlineAlert>
        ) : null}
        {status.status === "requires_review" ? (
          <div className="mt-5">
            <InlineAlert tone="warning">
              Tu estado de consentimiento requiere revision. Contacta soporte para continuar.
            </InlineAlert>
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-5">
          <FormErrorSummary message={submitError} />
          {documents.map((document) => (
            <ConsentCheckboxCard
              key={document.id}
              documentId={document.id}
              consentType={document.type}
              title={document.title || getConsentTypeLabel(document.type)}
              description={getConsentDescription(document.type)}
              version={document.version}
              hashSha256={document.hashSha256}
              checked={Boolean(checked[document.id])}
              required={document.isRequired}
              disabled={
                isSubmitting || status.status === "requires_review" || hasCompletedConsents
              }
              showMissing={showMissing}
              onChange={(value) => handleCheck(document, value)}
              onOpenDocument={() => handleOpenDocument(document)}
            />
          ))}

          <div className="rounded-2xl border border-labora-ui bg-white p-5 text-sm text-labora-gray">
            Selecciona <span className="font-semibold text-labora-deep">Ver documento completo</span>{" "}
            en cualquier consentimiento para abrir el texto legal oficial.
          </div>
        </div>

        <ConsentSummaryPanel
          requiredCount={requiredDocuments.length}
          acceptedCount={acceptedRequiredCount}
          missingConsentTypes={missingConsentTypes.length ? missingConsentTypes : status.missingConsentTypes}
          status={visualStatus}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          submitLabel={hasCompletedConsents ? "Continuar" : "Aceptar y continuar"}
          helperText={
            hasCompletedConsents
              ? "Tus autorizaciones vigentes ya estan completas. Puedes continuar al expediente."
              : "Para continuar con tu expediente, debes completar estas autorizaciones."
          }
          onSubmit={handleSubmit}
          onSave={() => router.push("/app/dashboard")}
        />
      </div>

      <div className="sticky bottom-0 z-10 -mx-5 border-t border-labora-ui bg-white/95 p-4 shadow-panel backdrop-blur lg:hidden">
        <button
          type="button"
          disabled={!canSubmit || isSubmitting}
          onClick={handleSubmit}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white hover:bg-labora-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle2 className="h-4 w-4" />
          {isSubmitting ? "Guardando..." : hasCompletedConsents ? "Continuar" : "Aceptar y continuar"}
        </button>
      </div>

      {isDocumentViewerOpen && selectedDocument ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-labora-charcoal/55 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Documento legal ${selectedDocument.title}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsDocumentViewerOpen(false);
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden">
            <LegalDocumentViewer
              title={selectedDocument.title}
              version={selectedDocument.version}
              hashSha256={selectedDocument.hashSha256}
              contentMarkdown={selectedDocument.contentMarkdown}
              onClose={() => setIsDocumentViewerOpen(false)}
              onViewed={() =>
                emitConsentEvent("legal_document_scrolled", {
                  consentType: selectedDocument.type,
                })
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
