export function validateDateRange(startDate: string, endDate?: string | null) {
  if (!startDate) {
    return "La fecha de inicio es obligatoria.";
  }

  if (!endDate) {
    return null;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Revisa el formato de las fechas.";
  }

  if (end < start) {
    return "La fecha final no puede ser menor que la fecha de inicio.";
  }

  return null;
}

export function validateWeeks(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return null;
  }

  if (value < 0) {
    return "Las semanas no pueden ser negativas.";
  }

  return null;
}

export function validateSalaryBase(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return null;
  }

  if (value < 0) {
    return "El valor no puede ser negativo.";
  }

  return null;
}
