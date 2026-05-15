export type ConfidenceTone = "success" | "warning" | "danger" | "neutral";

export function normalizeConfidence(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value > 1 ? value / 100 : value;
}

export function formatConfidencePercent(value?: number | null) {
  const normalized = normalizeConfidence(value);

  if (normalized === null) {
    return "Sin dato";
  }

  return `${Math.round(Math.max(0, Math.min(1, normalized)) * 100)}%`;
}

export function getConfidenceMeta(value?: number | null): {
  label: string;
  tone: ConfidenceTone;
  valueText: string;
} {
  const normalized = normalizeConfidence(value);

  if (normalized === null) {
    return {
      label: "Sin confianza calculada",
      tone: "neutral",
      valueText: "Sin dato",
    };
  }

  if (normalized >= 0.85) {
    return {
      label: "Alta confianza",
      tone: "success",
      valueText: formatConfidencePercent(normalized),
    };
  }

  if (normalized >= 0.65) {
    return {
      label: "Revisar",
      tone: "warning",
      valueText: formatConfidencePercent(normalized),
    };
  }

  return {
    label: "Baja confianza",
    tone: "danger",
    valueText: formatConfidencePercent(normalized),
  };
}
