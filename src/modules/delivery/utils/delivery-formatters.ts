import type {
  DeliveryActorRole,
  DeliveryPackageStatus,
  DownloadFileCategory,
  DownloadFileStatus,
  ShareLinkStatus,
  SharePermission,
} from "@/src/modules/delivery/api/delivery.types";

export type DeliveryTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "deep";

export interface StatusMeta {
  label: string;
  message: string;
  tone: DeliveryTone;
}

export const deliveryPackageStatusMeta: Record<DeliveryPackageStatus, StatusMeta> = {
  not_started: {
    label: "No iniciado",
    message: "Aun no hay una entrega final disponible.",
    tone: "neutral",
  },
  generating: {
    label: "Generando",
    message: "Estamos preparando los documentos finales.",
    tone: "info",
  },
  ready: {
    label: "Listo",
    message: "Tu expediente final esta listo para descargar y compartir.",
    tone: "success",
  },
  partially_ready: {
    label: "Parcialmente listo",
    message: "Algunos documentos estan listos y otros siguen en revision.",
    tone: "warning",
  },
  blocked: {
    label: "Bloqueado",
    message: "La entrega esta bloqueada temporalmente.",
    tone: "danger",
  },
  requires_review: {
    label: "En revision",
    message: "Tu entrega requiere una revision adicional.",
    tone: "warning",
  },
  completed: {
    label: "Completado",
    message: "La entrega fue completada.",
    tone: "deep",
  },
  closed: {
    label: "Cerrado",
    message: "El caso esta cerrado, pero puedes consultar documentos e historial.",
    tone: "deep",
  },
  error: {
    label: "Error",
    message: "No pudimos cargar o preparar la entrega final.",
    tone: "danger",
  },
};

export const downloadFileStatusMeta: Record<DownloadFileStatus, StatusMeta> = {
  pending: {
    label: "Pendiente",
    message: "El archivo se esta preparando.",
    tone: "info",
  },
  available: {
    label: "Disponible",
    message: "El archivo esta listo para descargar.",
    tone: "success",
  },
  locked: {
    label: "Bloqueado",
    message: "Este documento aun no esta disponible porque requiere revision o desbloqueo.",
    tone: "danger",
  },
  requires_review: {
    label: "En revision",
    message: "Este archivo requiere revision antes de descargarse.",
    tone: "warning",
  },
  expired: {
    label: "Expirado",
    message: "El acceso a este archivo expiro.",
    tone: "neutral",
  },
  deleted: {
    label: "Eliminado",
    message: "Este archivo ya no esta disponible.",
    tone: "neutral",
  },
  error: {
    label: "Error",
    message: "No pudimos cargar el estado de este archivo.",
    tone: "danger",
  },
};

export const shareLinkStatusMeta: Record<ShareLinkStatus, StatusMeta> = {
  active: {
    label: "Activo",
    message: "El enlace esta vigente.",
    tone: "success",
  },
  expired: {
    label: "Expirado",
    message: "El enlace ya no permite acceso.",
    tone: "neutral",
  },
  revoked: {
    label: "Revocado",
    message: "El enlace fue revocado.",
    tone: "danger",
  },
  max_views_reached: {
    label: "Limite alcanzado",
    message: "El enlace alcanzo el limite de vistas.",
    tone: "warning",
  },
  disabled: {
    label: "Deshabilitado",
    message: "El enlace no esta disponible.",
    tone: "neutral",
  },
};

export const fileCategoryLabels: Record<DownloadFileCategory, string> = {
  executive_report: "Informe ejecutivo",
  technical_report: "Informe tecnico completo",
  inconsistency_matrix: "Matriz de inconsistencias",
  calculation_sheet: "Calculo estimado",
  legal_claim: "Reclamacion",
  petition: "Peticion",
  lawsuit_draft: "Borrador de demanda",
  attachments_index: "Indice de anexos",
  traceability_log: "Trazabilidad",
  supporting_document: "Soporte",
  other: "Otro documento",
};

export const sharePermissionLabels: Record<SharePermission, string> = {
  view: "Ver documentos",
  download: "Descargar documentos",
  comment: "Comentar",
  upload_supporting_files: "Subir soportes complementarios",
};

export const actorRoleLabels: Record<DeliveryActorRole, string> = {
  user: "Usuario",
  admin: "Equipo Labora",
  lawyer: "Abogado",
  reviewer: "Revisor",
  system: "Sistema",
};

export function formatDeliveryDate(value?: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatShortDate(value?: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
  }).format(date);
}

export function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "Sin tamano";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** index;

  return `${size >= 10 || index === 0 ? Math.round(size) : size.toFixed(1)} ${units[index]}`;
}

export function canDownloadFile(status: DownloadFileStatus, isUnlocked: boolean) {
  return status === "available" && isUnlocked;
}

export function getDeliveryPackageStatusMeta(status: DeliveryPackageStatus) {
  return deliveryPackageStatusMeta[status] || deliveryPackageStatusMeta.not_started;
}

export function getDownloadFileStatusMeta(status: DownloadFileStatus) {
  return downloadFileStatusMeta[status] || downloadFileStatusMeta.pending;
}

export function getShareLinkStatusMeta(status: ShareLinkStatus) {
  return shareLinkStatusMeta[status] || shareLinkStatusMeta.disabled;
}
