import { apiFetch, unwrapApiData } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";
import type {
  ConsentHistoryItem,
  ConsentStatusResponse,
  LegalDocument,
  SubmitConsentsRequest,
  SubmitConsentsResponse,
} from "@/types/consent";

type ListResponse<T> = T[] | { items?: T[]; data?: T[] };

function unwrapList<T>(response: ListResponse<T> | ApiEnvelope<ListResponse<T>>): T[] {
  const data = unwrapApiData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  return data.items || [];
}

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function getCurrentLegalDocuments(): Promise<LegalDocument[]> {
  const response = await apiFetch<
    ListResponse<LegalDocument> | ApiEnvelope<ListResponse<LegalDocument>>
  >("/legal-documents/current");

  return unwrapList(response);
}

export async function getConsentStatus(): Promise<ConsentStatusResponse> {
  const response = await apiFetch<
    ConsentStatusResponse | ApiEnvelope<ConsentStatusResponse>
  >("/users/me/consents/status");

  return unwrapApiData(response);
}

export async function submitConsents(
  payload: SubmitConsentsRequest,
): Promise<SubmitConsentsResponse> {
  const response = await apiFetch<
    SubmitConsentsResponse | ApiEnvelope<SubmitConsentsResponse> | void
  >("/consents", {
    method: "POST",
    headers: {
      "Idempotency-Key": createIdempotencyKey(),
    },
    body: JSON.stringify(payload),
  });

  return response ? unwrapApiData(response) : {};
}

export async function getConsentHistory(): Promise<ConsentHistoryItem[]> {
  const response = await apiFetch<
    ListResponse<ConsentHistoryItem> | ApiEnvelope<ListResponse<ConsentHistoryItem>>
  >("/users/me/consents");

  return unwrapList(response);
}
