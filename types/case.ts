export type CaseStatus =
  | "draft"
  | "pending_payment"
  | "payment_approved"
  | "documents_pending"
  | "documents_uploaded"
  | "document_validation"
  | "questionnaire_pending"
  | "analysis_pending"
  | "analysis_processing"
  | "results_available"
  | "legal_draft_generated"
  | "professional_review"
  | "completed"
  | "closed";

export interface LaboraCase {
  id: string;
  caseNumber: string;
  userId: string;
  serviceType: string;
  status: CaseStatus;
  holderName: string;
  actingAs?: string;
  pensionFund?: string;
  caseType?: string;
  createdAt: string;
  updatedAt: string;
}
