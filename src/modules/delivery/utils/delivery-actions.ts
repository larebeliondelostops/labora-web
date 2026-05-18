export function openTemporaryDownload(url: string) {
  if (!url || typeof window === "undefined") {
    return;
  }

  window.location.assign(url);
}

export async function copyToClipboard(value: string) {
  if (!value) {
    return false;
  }

  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  return false;
}

export function getDateInputValue(daysFromToday: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

export function toEndOfDayIso(dateInputValue: string) {
  return new Date(`${dateInputValue}T23:59:59`).toISOString();
}

export function isFutureDateInput(value: string) {
  if (!value) {
    return false;
  }

  const selected = new Date(`${value}T23:59:59`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return selected > today;
}
