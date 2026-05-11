import { apiFetch } from "@/lib/api";

export interface PublicHomeContent {
  hero?: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
  };
  benefits?: Array<{
    title: string;
    description: string;
  }>;
  legalNotice?: string;
}

export interface PublicFaq {
  category: string;
  question: string;
  answer: string;
}

export interface LeadPayload {
  fullName: string;
  email: string;
  phone?: string;
  serviceInterest?: string;
  message?: string;
  source: "contact_form";
  acceptedPrivacyNotice: boolean;
  utm: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
}

export async function getPublicHome(): Promise<PublicHomeContent> {
  return apiFetch<PublicHomeContent>("/public/home");
}

export async function getPublicFaqs(category?: string): Promise<PublicFaq[]> {
  const params = category && category !== "todos" ? `?category=${category}` : "";
  const response = await apiFetch<PublicFaq[] | { items?: PublicFaq[] }>(
    `/public/faqs${params}`,
  );

  if (Array.isArray(response)) {
    return response;
  }

  return response.items || [];
}

export async function createLead(payload: LeadPayload): Promise<void> {
  await apiFetch<void>("/leads", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function trackPublicEvent(
  eventName: string,
  metadata?: Record<string, string | number | boolean | null>,
): Promise<void> {
  try {
    await apiFetch<void>("/public/events", {
      method: "POST",
      body: JSON.stringify({
        eventName,
        metadata: metadata || {},
      }),
    });
  } catch {
    // Public analytics must never block navigation or lead capture.
  }
}
