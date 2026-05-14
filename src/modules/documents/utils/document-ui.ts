import type { ApiError } from "@/lib/api";
import type {
  DocumentItem,
  DocumentReadiness,
  DocumentReadinessStatus,
  DocumentStatus,
  DocumentTypeDefinition,
  DocumentValidationResult,
  DocumentValidationStatus,
} from "@/src/modules/documents/api/documents.types";

export const DEFAULT_DOCUMENT_TYPES: DocumentTypeDefinition[] = [
  {
    code: "historia_laboral",
    name: "Historia laboral",
    category: "principal",
    isRequiredForBasicFlow: true,
    isPrimaryCandidate: true,
    allowedMimeTypes: ["application/pdf"],
    maxSizeMb: 50,
  },
  {
    code: "cedula",
    name: "Documento de identidad",
    category: "soporte",
    isRequiredForBasicFlow: false,
    isPrimaryCandidate: false,
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxSizeMb: 20,
  },
  {
    code: "resolucion_pensional",
    name: "Resolucion pensional",
    category: "soporte",
    isRequiredForBasicFlow: false,
    isPrimaryCandidate: false,
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxSizeMb: 50,
  },
  {
    code: "certificado_tiempos",
    name: "Certificado de tiempos",
    category: "soporte",
    isRequiredForBasicFlow: false,
    isPrimaryCandidate: false,
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxSizeMb: 50,
  },
  {
    code: "otro_soporte",
    name: "Otro soporte",
    category: "otro",
    isRequiredForBasicFlow: false,
    isPrimaryCandidate: false,
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxSizeMb: 50,
  },
];

export const documentStatusLabel: Record<DocumentStatus, string> = {
  draft: "Borrador",
  uploading: "Cargando",
  uploaded: "Cargado",
  processing: "Procesando",
  validated: "Validado",
  requires_review: "Requiere revision",
  rejected: "Rechazado",
  replaced: "Reemplazado",
  deleted: "Eliminado",
  failed: "Error",
};

export const validationStatusLabel: Record<DocumentValidationStatus, string> = {
  not_started: "Sin iniciar",
  in_progress: "En validacion",
  completed: "Completada",
  blocked: "Bloqueada",
  requires_review: "Requiere revision",
  error: "Error",
};

export const validationResultLabel: Record<DocumentValidationResult, string> = {
  accepted: "Aceptado",
  accepted_with_warnings: "Aceptado con observaciones",
  rejected: "Rechazado",
  requires_review: "Requiere revision",
};

export const readinessCopy: Record<
  DocumentReadinessStatus,
  {
    title: string;
    description: string;
    tone: "success" | "warning" | "danger" | "neutral" | "progress";
  }
> = {
  missing_primary_document: {
    title: "Falta historia laboral",
    description: "Sube el PDF principal para activar la validacion preliminar.",
    tone: "warning",
  },
  validating: {
    title: "Validando documentos",
    description: "Estamos revisando legibilidad, duplicados y tipo documental.",
    tone: "progress",
  },
  ready_for_preanalysis: {
    title: "Listo para validacion preliminar",
    description: "Tus documentos principales estan cargados y aptos.",
    tone: "success",
  },
  requires_review: {
    title: "Hay documentos por revisar",
    description: "Confirma clasificacion, advertencias o reemplazos antes de avanzar.",
    tone: "warning",
  },
  blocked: {
    title: "Carga documental bloqueada",
    description: "Resuelve los errores documentales para continuar.",
    tone: "danger",
  },
};

export function getStatusTone(
  status: DocumentStatus,
  validationResult?: DocumentValidationResult,
): "success" | "warning" | "danger" | "neutral" | "progress" {
  if (status === "validated" || validationResult === "accepted") {
    return "success";
  }

  if (status === "requires_review" || validationResult === "accepted_with_warnings") {
    return "warning";
  }

  if (status === "rejected" || status === "failed" || validationResult === "rejected") {
    return "danger";
  }

  if (status === "uploading" || status === "processing") {
    return "progress";
  }

  return "neutral";
}

export function getValidationTone(
  validationStatus: DocumentValidationStatus,
  validationResult?: DocumentValidationResult,
): "success" | "warning" | "danger" | "neutral" | "progress" {
  if (validationResult === "accepted" || validationStatus === "completed") {
    return "success";
  }

  if (
    validationResult === "accepted_with_warnings" ||
    validationResult === "requires_review" ||
    validationStatus === "requires_review"
  ) {
    return "warning";
  }

  if (validationResult === "rejected" || validationStatus === "blocked" || validationStatus === "error") {
    return "danger";
  }

  if (validationStatus === "in_progress") {
    return "progress";
  }

  return "neutral";
}

export function isDocumentProcessing(document: DocumentItem) {
  return (
    document.status === "uploading" ||
    document.status === "uploaded" ||
    document.status === "processing" ||
    document.validationStatus === "in_progress"
  );
}

export function isDocumentFinal(document: DocumentItem) {
  return [
    "validated",
    "requires_review",
    "rejected",
    "failed",
    "replaced",
    "deleted",
  ].includes(document.status);
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;

  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

export function formatConfidence(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Sin dato";
  }

  const normalized = value <= 1 ? value * 100 : value;
  return `${Math.round(normalized)}%`;
}

export function isLowConfidence(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return false;
  }

  const normalized = value <= 1 ? value : value / 100;
  return normalized > 0 && normalized < 0.72;
}

export function getDocumentDisplayName(document: DocumentItem) {
  return document.displayName || document.originalFilename;
}

export function getPrimaryDocumentType(documentTypes: DocumentTypeDefinition[]) {
  return (
    documentTypes.find((type) => type.isPrimaryCandidate) ||
    documentTypes.find((type) => type.category === "principal") ||
    DEFAULT_DOCUMENT_TYPES[0]
  );
}

export function getDocumentTypeByCode(
  documentTypes: DocumentTypeDefinition[],
  code?: string,
) {
  return documentTypes.find((type) => type.code === code);
}

export function getAllowedMimeTypes(documentTypes: DocumentTypeDefinition[]) {
  const values = new Set<string>();

  documentTypes.forEach((type) => {
    type.allowedMimeTypes.forEach((mimeType) => values.add(mimeType));
  });

  return Array.from(values);
}

export function getMaxSizeMbForType(
  documentTypes: DocumentTypeDefinition[],
  documentTypeCode?: string,
) {
  if (!documentTypeCode) {
    return Math.max(...documentTypes.map((type) => type.maxSizeMb), 50);
  }

  return getDocumentTypeByCode(documentTypes, documentTypeCode)?.maxSizeMb || 50;
}

export function validateDocumentFile({
  file,
  documentTypes,
  documentTypeCode,
}: {
  file: File;
  documentTypes: DocumentTypeDefinition[];
  documentTypeCode?: string;
}) {
  if (!file.name.trim()) {
    return "El archivo necesita un nombre valido.";
  }

  const type = documentTypeCode
    ? getDocumentTypeByCode(documentTypes, documentTypeCode)
    : undefined;
  const allowedMimeTypes = type?.allowedMimeTypes.length
    ? type.allowedMimeTypes
    : getAllowedMimeTypes(documentTypes);
  const isAllowedMime = file.type ? allowedMimeTypes.includes(file.type) : false;
  const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
  const lowerName = file.name.toLowerCase();
  const isAllowedExtension = allowedExtensions.some((extension) =>
    lowerName.endsWith(extension),
  );

  if (!isAllowedMime && !isAllowedExtension) {
    return "Este tipo de archivo no esta permitido.";
  }

  const maxSizeMb = type?.maxSizeMb || getMaxSizeMbForType(documentTypes, documentTypeCode);
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return "El archivo supera el tamano maximo permitido.";
  }

  if (type?.isPrimaryCandidate && file.type && file.type !== "application/pdf") {
    return "Para historia laboral preferimos un PDF exportado desde tu fondo de pensiones.";
  }

  return null;
}

export function getApiErrorCode(error: unknown) {
  return (error as ApiError | undefined)?.code;
}

export function deriveReadinessFromDocuments(
  caseId: string,
  documents: DocumentItem[],
): DocumentReadiness {
  const activeDocuments = documents.filter(
    (document) => document.status !== "deleted" && document.status !== "replaced",
  );
  const hasPrimaryLaborHistory = activeDocuments.some((document) => document.isPrimary);
  const processing = activeDocuments.some(isDocumentProcessing);
  const documentsRejected = activeDocuments.filter((document) => document.status === "rejected").length;
  const documentsWithWarnings = activeDocuments.filter(
    (document) =>
      document.status === "requires_review" ||
      document.validationResult === "accepted_with_warnings",
  ).length;
  const documentsValidated = activeDocuments.filter(
    (document) => document.status === "validated" || document.validationResult === "accepted",
  ).length;

  let readinessStatus: DocumentReadinessStatus = "missing_primary_document";

  if (!hasPrimaryLaborHistory) {
    readinessStatus = "missing_primary_document";
  } else if (processing) {
    readinessStatus = "validating";
  } else if (documentsRejected > 0) {
    readinessStatus = "blocked";
  } else if (documentsWithWarnings > 0) {
    readinessStatus = "requires_review";
  } else {
    readinessStatus = "ready_for_preanalysis";
  }

  return {
    caseId,
    readinessStatus,
    hasPrimaryLaborHistory,
    documentsTotal: activeDocuments.length,
    documentsValidated,
    documentsWithWarnings,
    documentsRejected,
    blockingIssues:
      readinessStatus === "missing_primary_document"
        ? [
            {
              code: "MISSING_PRIMARY_DOCUMENT",
              message: "Necesitas subir una historia laboral para continuar.",
            },
          ]
        : [],
    warnings: documentsWithWarnings
      ? [
          {
            code: "DOCUMENTS_REQUIRE_REVIEW",
            message: "Hay documentos con observaciones pendientes.",
          },
        ]
      : [],
    nextAction:
      readinessStatus === "ready_for_preanalysis"
        ? "continue_to_preanalysis"
        : readinessStatus === "missing_primary_document"
          ? "upload_primary_document"
          : "review_documents",
  };
}
