"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileUp, RotateCcw, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DeleteDocumentModal,
  DocumentClassificationPanel,
  DocumentMetadataPanel,
  DocumentValidationPanel,
  DocumentViewer,
  InlineError,
  LoadingSkeleton,
  ReplaceDocumentModal,
} from "@/src/modules/documents/components/document-components";
import {
  useDeleteDocument,
  useDocumentDetail,
  useDocumentTypes,
  useDocumentViewUrl,
  useReplaceDocument,
  useUpdateDocument,
} from "@/src/modules/documents/hooks/useDocuments";
import { isDocumentProcessing } from "@/src/modules/documents/utils/document-ui";

type ViewerTab = "document" | "data" | "validation" | "actions";

const tabs: Array<{ id: ViewerTab; label: string }> = [
  { id: "document", label: "Documento" },
  { id: "data", label: "Datos" },
  { id: "validation", label: "Validacion" },
  { id: "actions", label: "Acciones" },
];

export function DocumentViewerPage({
  caseId,
  documentId,
}: {
  caseId: string;
  documentId: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ViewerTab>("document");
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const documentTypes = useDocumentTypes();
  const detail = useDocumentDetail(documentId);
  const viewUrl = useDocumentViewUrl(documentId, Boolean(detail.data));
  const updateDocument = useUpdateDocument();
  const replaceDocument = useReplaceDocument({
    onCompleted: () => {
      detail.refetch();
    },
  });
  const deleteDocument = useDeleteDocument();

  useEffect(() => {
    if (!detail.data || !isDocumentProcessing(detail.data)) {
      return;
    }

    const timer = window.setInterval(() => {
      detail.refresh();
    }, 4000);

    return () => window.clearInterval(timer);
  }, [detail]);

  async function handleDelete() {
    await deleteDocument.mutate(documentId);
    router.push(`/app/cases/${caseId}/documents`);
  }

  async function handleClassificationSave(payload: {
    documentTypeCode?: string;
    isPrimary?: boolean;
  }) {
    await updateDocument.mutate(documentId, payload);
    await detail.refetch();
  }

  if (detail.isLoading) {
    return <LoadingSkeleton rows={3} />;
  }

  if (detail.error || !detail.data) {
    return (
      <section className="space-y-5">
        <Link
          href={`/app/cases/${caseId}/documents`}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-labora-ui bg-white px-4 py-2 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a documentos
        </Link>
        <InlineError
          message={detail.error || "No encontramos este documento."}
          onRetry={detail.refetch}
        />
      </section>
    );
  }

  const document = detail.data;
  const documentPanel = (
    <DocumentViewer
      url={viewUrl.data?.url}
      mimeType={document.mimeType}
      filename={document.displayName || document.originalFilename}
    />
  );
  const dataPanel = (
    <>
      <DocumentMetadataPanel document={document} />
      <DocumentClassificationPanel
        document={document}
        documentTypes={documentTypes.data}
        isSaving={updateDocument.isLoading}
        error={updateDocument.error}
        onSave={handleClassificationSave}
      />
    </>
  );
  const validationPanel = (
    <DocumentValidationPanel
      validation={document.validation}
      status={document.status}
      onReplace={() => setReplaceOpen(true)}
      onConfirmReview={() => detail.refetch()}
    />
  );
  const actionsPanel = (
    <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
        Acciones
      </h2>
      <div className="mt-4 grid gap-3">
        <button
          type="button"
          onClick={() => setReplaceOpen(true)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-labora-deep"
        >
          <FileUp className="h-4 w-4" aria-hidden="true" />
          Reemplazar documento
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Eliminar documento
        </button>
      </div>
    </section>
  );

  return (
    <section className="space-y-5 pb-20 md:pb-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`/app/cases/${caseId}/documents`}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-labora-ui bg-white px-4 py-2 text-sm font-semibold text-labora-deep transition hover:bg-labora-ivory"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a documentos
          </Link>
          <h1 className="mt-4 font-heading text-2xl font-semibold text-labora-charcoal sm:text-3xl">
            {document.displayName || document.originalFilename}
          </h1>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            Revisa el archivo, confirma clasificacion y valida observaciones antes
            de continuar a la validacion preliminar.
          </p>
        </div>
        {isDocumentProcessing(document) ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-labora-mint bg-labora-mint/20 px-3 py-2 text-sm font-semibold text-labora-deep">
            <RotateCcw className="h-4 w-4 animate-spin" aria-hidden="true" />
            Validando
          </div>
        ) : null}
      </div>

      {viewUrl.error ? (
        <InlineError message={viewUrl.error} onRetry={viewUrl.refetch} />
      ) : null}

      <div className="rounded-2xl border border-labora-ui bg-white p-2 shadow-panel md:hidden">
        <div className="grid grid-cols-4 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "min-h-10 rounded-lg px-2 py-2 text-xs font-semibold transition",
                activeTab === tab.id
                  ? "bg-labora-green text-white"
                  : "text-labora-gray hover:bg-labora-ivory hover:text-labora-deep",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="md:hidden">
        {activeTab === "document" ? documentPanel : null}
        {activeTab === "data" ? <div className="space-y-5">{dataPanel}</div> : null}
        {activeTab === "validation" ? validationPanel : null}
        {activeTab === "actions" ? actionsPanel : null}
      </div>

      <div className="hidden gap-5 md:grid xl:grid-cols-[minmax(0,65%)_minmax(320px,35%)]">
        <div>{documentPanel}</div>
        <aside className="space-y-5">
          {dataPanel}
          {validationPanel}
          {actionsPanel}
        </aside>
      </div>

      <ReplaceDocumentModal
        open={replaceOpen}
        document={document}
        documentTypes={documentTypes.data}
        isLoading={replaceDocument.isLoading}
        error={replaceDocument.error}
        onClose={() => setReplaceOpen(false)}
        onConfirm={async (file, payload) => {
          await replaceDocument.mutate(document.id, file, payload);
          setReplaceOpen(false);
          await detail.refetch();
          await viewUrl.refetch();
        }}
      />

      <DeleteDocumentModal
        open={deleteOpen}
        document={document}
        isOnlyPrimary={document.isPrimary}
        isLoading={deleteDocument.isLoading}
        error={deleteDocument.error}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </section>
  );
}
