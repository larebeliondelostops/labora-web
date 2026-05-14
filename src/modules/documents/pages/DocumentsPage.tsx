"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, FileUp, RotateCcw } from "lucide-react";

import { CaseHeader } from "@/src/modules/cases/components/CaseHeader";
import { useCaseDetail } from "@/src/modules/cases/hooks/useCaseDetail";
import { getHolderFullName } from "@/src/modules/cases/utils/caseFormatters";
import {
  CaseFlowStepper,
  DeleteDocumentModal,
  DocumentClassificationPanel,
  DocumentReadinessCard,
  DocumentsTable,
  DocumentUploadDropzone,
  EmptyState,
  InlineError,
  LoadingSkeleton,
  ReplaceDocumentModal,
  RequiredDocumentChecklist,
  RetryButton,
} from "@/src/modules/documents/components/document-components";
import type { DocumentItem } from "@/src/modules/documents/api/documents.types";
import {
  useCaseDocuments,
  useDeleteDocument,
  useDocumentReadiness,
  useDocumentTypes,
  useReplaceDocument,
  useUpdateDocument,
  useUploadDocument,
} from "@/src/modules/documents/hooks/useDocuments";

function PageHeaderFallback({ caseId }: { caseId: string }) {
  return (
    <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
        Expediente digital
      </p>
      <h1 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
        Expediente {caseId}
      </h1>
      <p className="mt-1 text-sm text-labora-gray">Carga y gestion documental</p>
    </header>
  );
}

export function DocumentsPage({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [documentToReplace, setDocumentToReplace] = useState<DocumentItem | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentItem | null>(null);
  const [documentToClassify, setDocumentToClassify] = useState<DocumentItem | null>(null);

  const caseDetail = useCaseDetail(caseId);
  const documentTypes = useDocumentTypes();
  const documents = useCaseDocuments(caseId);
  const readiness = useDocumentReadiness(caseId, documents.data);
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();

  const refreshDocuments = async () => {
    await Promise.all([documents.refresh(), readiness.refresh()]);
  };

  const uploadDocument = useUploadDocument({
    caseId,
    onCompleted: () => {
      refreshDocuments();
    },
  });
  const replaceDocument = useReplaceDocument({
    onCompleted: () => {
      refreshDocuments();
    },
  });

  const activeDocuments = useMemo(
    () =>
      documents.data.filter(
        (document) => document.status !== "deleted" && document.status !== "replaced",
      ),
    [documents.data],
  );
  const primaryDocumentsCount = activeDocuments.filter((document) => document.isPrimary).length;
  const canContinue =
    readiness.data.readinessStatus === "ready_for_preanalysis" &&
    readiness.data.nextAction === "continue_to_preanalysis";

  async function handleUpload(
    files: File[],
    options: { documentTypeCode?: string; isPrimary?: boolean },
  ) {
    const uploaded = await uploadDocument.uploadFiles(files, options);
    await refreshDocuments();
    return uploaded;
  }

  async function handleClassificationSave(document: DocumentItem, payload: { documentTypeCode?: string; isPrimary?: boolean }) {
    await updateDocument.mutate(document.id, payload);
    setDocumentToClassify(null);
    await refreshDocuments();
  }

  async function handleDelete() {
    if (!documentToDelete) {
      return;
    }

    await deleteDocument.mutate(documentToDelete.id);
    setDocumentToDelete(null);
    await refreshDocuments();
  }

  return (
    <section className="space-y-5 pb-28 md:pb-0">
      {caseDetail.isLoading ? <LoadingSkeleton rows={1} /> : null}
      {!caseDetail.isLoading && caseDetail.data ? (
        <CaseHeader
          caseNumber={caseDetail.data.caseNumber}
          status={caseDetail.data.status}
          holderFullName={getHolderFullName(caseDetail.data.holder)}
          updatedAt={caseDetail.data.updatedAt}
        />
      ) : null}
      {!caseDetail.isLoading && !caseDetail.data ? <PageHeaderFallback caseId={caseId} /> : null}

      <CaseFlowStepper />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <DocumentReadinessCard
            readiness={readiness.data}
            ctaHref={`/app/cases/${caseId}/preanalysis`}
          />

          <section
            id="document-upload"
            aria-label="Carga documental"
            className="scroll-mt-6"
          >
            <DocumentUploadDropzone
              caseId={caseId}
              documentTypes={documentTypes.data}
              uploadItems={uploadDocument.items}
              onUpload={handleUpload}
              onCancelUpload={uploadDocument.cancelUpload}
            />
          </section>

          {documents.isLoading ? <LoadingSkeleton rows={2} /> : null}

          {!documents.isLoading && documents.error ? (
            <InlineError message={documents.error} onRetry={documents.refetch} />
          ) : null}

          {!documents.isLoading && !documents.error && activeDocuments.length === 0 ? (
            <EmptyState
              title="Sube tu historia laboral para comenzar"
              description="Carga el PDF exportado desde tu fondo de pensiones. Tambien puedes agregar soportes opcionales si los tienes."
              primaryAction={
                <a
                  href="#document-upload"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep"
                >
                  <FileUp className="h-4 w-4" aria-hidden="true" />
                  Subir historia laboral
                </a>
              }
              secondaryAction={
                <a
                  href="#document-upload"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory"
                >
                  Agregar soporte
                </a>
              }
            />
          ) : null}

          {documentToClassify ? (
            <DocumentClassificationPanel
              document={documentToClassify}
              documentTypes={documentTypes.data}
              isSaving={updateDocument.isLoading}
              error={updateDocument.error}
              onSave={(payload) => handleClassificationSave(documentToClassify, payload)}
            />
          ) : null}

          {!documents.isLoading && activeDocuments.length > 0 ? (
            <DocumentsTable
              documents={activeDocuments}
              loading={documents.isRefreshing}
              onView={(documentId) =>
                router.push(`/app/cases/${caseId}/documents/${documentId}`)
              }
              onChangeType={setDocumentToClassify}
              onReplace={setDocumentToReplace}
              onDelete={setDocumentToDelete}
            />
          ) : null}
        </div>

        <aside className="space-y-5">
          <RequiredDocumentChecklist
            documentTypes={documentTypes.data}
            documents={activeDocuments}
          />

          <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-labora-green" aria-hidden="true" />
              <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                Revision automatica
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-labora-gray">
              La revision automatica ayuda a detectar si el archivo es legible,
              esta completo y parece corresponder al tipo de documento seleccionado.
            </p>
            <p className="mt-3 rounded-xl border border-labora-ui bg-labora-ivory p-3 text-sm leading-6 text-labora-gray">
              Con estos documentos podremos preparar una validacion preliminar.
              El analisis completo se desbloquea despues del pago.
            </p>
          </section>

          {documentTypes.error ? (
            <InlineError
              message="No pudimos cargar los tipos documentales del backend. Usamos opciones base mientras reintentas."
              onRetry={documentTypes.refetch}
            />
          ) : null}

          {readiness.error ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              No pudimos obtener el readiness del backend. Calculamos un estado
              local temporal con los documentos disponibles.
              <RetryButton onClick={readiness.refetch} className="mt-3 bg-white" />
            </div>
          ) : null}

          {documents.shouldPoll ? (
            <div className="flex items-center gap-2 rounded-2xl border border-labora-mint bg-labora-mint/20 p-4 text-sm font-medium text-labora-deep">
              <RotateCcw className="h-4 w-4 animate-spin" aria-hidden="true" />
              Actualizando validacion documental.
            </div>
          ) : null}
        </aside>
      </div>

      <ReplaceDocumentModal
        open={Boolean(documentToReplace)}
        document={documentToReplace}
        documentTypes={documentTypes.data}
        isLoading={replaceDocument.isLoading}
        error={replaceDocument.error}
        onClose={() => setDocumentToReplace(null)}
        onConfirm={async (file, payload) => {
          if (!documentToReplace) {
            return;
          }
          await replaceDocument.mutate(documentToReplace.id, file, payload);
          setDocumentToReplace(null);
          await refreshDocuments();
        }}
      />

      <DeleteDocumentModal
        open={Boolean(documentToDelete)}
        document={documentToDelete}
        isOnlyPrimary={Boolean(
          documentToDelete?.isPrimary && primaryDocumentsCount <= 1,
        )}
        isLoading={deleteDocument.isLoading}
        error={deleteDocument.error}
        onClose={() => setDocumentToDelete(null)}
        onConfirm={handleDelete}
      />

      <Link
        href={`/app/cases/${caseId}/preanalysis`}
        aria-disabled={!canContinue}
        className={
          canContinue
            ? "fixed inset-x-4 bottom-4 z-20 inline-flex min-h-12 items-center justify-center rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white shadow-panel md:hidden"
            : "pointer-events-none fixed inset-x-4 bottom-4 z-20 inline-flex min-h-12 items-center justify-center rounded-lg border border-labora-ui bg-white px-5 py-3 text-sm font-semibold text-labora-gray shadow-panel md:hidden"
        }
      >
        Continuar a validacion preliminar
      </Link>
    </section>
  );
}
