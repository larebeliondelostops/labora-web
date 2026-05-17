export function formatCOP(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "No disponible";
  }

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return "Sin dato";
  }

  const normalized = score > 0 && score <= 1 ? score * 100 : score;
  return `${Math.round(Math.max(0, Math.min(100, normalized)))}%`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatImpact(value: "high" | "medium" | "low" | "none") {
  const copy = {
    high: "Alto",
    medium: "Medio",
    low: "Bajo",
    none: "Sin impacto",
  };

  return copy[value];
}

export function compactText(value: string | null | undefined, fallback = "No disponible") {
  return value?.trim() ? value.trim() : fallback;
}
