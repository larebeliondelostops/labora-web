export type LegalActionType =
  | "technical_report_download"
  | "executive_summary"
  | "petition"
  | "administrative_claim"
  | "reliquidation_request"
  | "administrative_appeal"
  | "lawsuit_draft"
  | "professional_review_request";

export type LegalActionStatus =
  | "not_started"
  | "in_progress"
  | "generated"
  | "requires_review"
  | "blocked"
  | "completed"
  | "cancelled"
  | "error";

export type EligibilityStatus =
  | "available"
  | "recommended"
  | "not_recommended"
  | "blocked"
  | "requires_more_data"
  | "requires_professional_review";

export type ProfessionalReviewLevel =
  | "none"
  | "optional"
  | "recommended"
  | "mandatory";

export type LegalDraftStatus =
  | "created"
  | "generating"
  | "ready_for_edit"
  | "editing"
  | "quality_check_pending"
  | "quality_check_failed"
  | "quality_check_passed"
  | "requires_review"
  | "approved"
  | "export_ready"
  | "exported"
  | "failed"
  | "archived";

export type DraftSectionStatus =
  | "pending"
  | "generating"
  | "generated"
  | "edited"
  | "approved"
  | "needs_data"
  | "low_confidence"
  | "failed";

export type WarningSeverity = "info" | "warning" | "critical";

export type Warning = {
  code: string;
  message: string;
  severity: WarningSeverity;
};

export type MissingAttachment = {
  code: string;
  label: string;
  required: boolean;
  description?: string;
};

export type LegalActionAvailable = {
  action_type: LegalActionType;
  title: string;
  description: string;
  eligibility_status: EligibilityStatus;
  eligibility_reason?: string;
  professional_review_level: ProfessionalReviewLevel;
  warnings: Warning[];
  missing_attachments: MissingAttachment[];
  is_recommended?: boolean;
};

export type LegalActionReadinessItem = {
  key: string;
  label: string;
  completed: boolean;
  href?: string;
};

export type LegalActionViability = "green" | "yellow" | "red" | "gray";

export type AvailableLegalActionsResponse = {
  case_id: string;
  case_number?: string;
  holder_name?: string;
  analysis_status?: string;
  viability?: LegalActionViability;
  recommended_route?: string;
  ready: boolean;
  readiness: LegalActionReadinessItem[];
  recommended_action_type?: LegalActionType;
  actions: LegalActionAvailable[];
  missing_attachments: MissingAttachment[];
  warnings: Warning[];
  updated_at?: string;
};

export type PendingMarker = {
  code: string;
  label: string;
  section_key?: string;
  severity: WarningSeverity;
};

export type SourceReference = {
  type:
    | "report"
    | "document"
    | "inconsistency"
    | "calculation"
    | "legal_rule"
    | "user_input";
  id: string;
  label: string;
};

export type DraftSection = {
  id: string;
  section_key: string;
  title: string;
  order_index: number;
  content_html: string;
  status: DraftSectionStatus;
  pending_markers: PendingMarker[];
  confidence_score?: number;
  source_references: SourceReference[];
};

export type DraftExport = {
  id: string;
  format: "pdf" | "docx";
  file_name: string;
  status: "queued" | "processing" | "ready" | "failed";
  download_url?: string;
  created_at: string;
};

export type QualityCheckStatus = "passed" | "warning" | "failed" | "pending";

export type QualityCheckItem = {
  id: string;
  label: string;
  status: QualityCheckStatus;
  message?: string;
  severity?: WarningSeverity;
};

export type QualityOverallStatus =
  | "passed"
  | "passed_with_warnings"
  | "failed"
  | "requires_review";

export type DraftQuality = {
  overall_status: QualityOverallStatus;
  score?: number;
  checks: QualityCheckItem[];
  critical_warnings: Warning[];
  recommendations: string[];
  can_export: boolean;
  updated_at?: string;
};

export type DraftAttachment = {
  id: string;
  label: string;
  type?: string;
  status: "available" | "missing" | "processing" | "failed";
  required: boolean;
  suggested: boolean;
};

export type LegalDraft = {
  id: string;
  case_id: string;
  legal_action_id: string;
  title: string;
  status: LegalDraftStatus;
  professional_review_level: ProfessionalReviewLevel;
  quality_score?: number;
  document_metadata: Record<string, unknown>;
  sections: DraftSection[];
  warnings: Warning[];
  exports: DraftExport[];
  quality?: DraftQuality;
  attachments: DraftAttachment[];
  missing_attachments: MissingAttachment[];
  pending_markers: PendingMarker[];
  can_export_pdf: boolean;
  can_export_docx: boolean;
  created_at?: string;
  updated_at?: string;
};

export type LegalDraftSummary = {
  id: string;
  title: string;
  status: LegalDraftStatus;
  quality_score?: number;
  created_at?: string;
  updated_at?: string;
};

export type SuggestedFact = {
  id: string;
  text: string;
  source: SourceReference["type"];
  source_label?: string;
  confidence_score?: number;
  selected: boolean;
};

export type SuggestedRequest = {
  id: string;
  text: string;
  selected: boolean;
  kind: "request" | "main_claim" | "subsidiary_claim";
};

export type LegalActionHistoryItem = {
  id: string;
  title: string;
  description?: string;
  occurred_at: string;
  status?: LegalActionStatus | LegalDraftStatus;
};

export type LegalActionDetail = {
  id: string;
  case_id: string;
  action_type: LegalActionType;
  title: string;
  status: LegalActionStatus;
  eligibility_status: EligibilityStatus;
  eligibility_reason?: string;
  professional_review_level: ProfessionalReviewLevel;
  warnings: Warning[];
  missing_attachments: MissingAttachment[];
  pending_data: PendingMarker[];
  drafts: LegalDraftSummary[];
  history: LegalActionHistoryItem[];
  suggested_facts: SuggestedFact[];
  suggested_requests: SuggestedRequest[];
  attachments: DraftAttachment[];
  created_at?: string;
  updated_at?: string;
};

export type CreateLegalActionRequest = {
  action_type: LegalActionType;
  selected_by_user: boolean;
  user_notes?: string;
};

export type CreateLegalActionResponse = {
  action_id: string;
  case_id: string;
  status: LegalActionStatus;
  draft_id?: string;
};

export type WizardClaimantData = {
  claimant_name: string;
  claimant_document_type: string;
  claimant_document_number: string;
  claimant_email: string;
  claimant_phone: string;
  claimant_address: string;
  claimant_city: string;
  acts_on_behalf_of_third_party: boolean;
  representative_name: string;
  representative_document: string;
};

export type WizardRecipientData = {
  recipient_entity: string;
  recipient_area: string;
  recipient_city: string;
  recipient_email: string;
  recipient_address: string;
  defendant_name: string;
  defendant_type: string;
};

export type WizardFactsData = {
  selected_facts: string[];
  edited_facts: Record<string, string>;
  additional_facts: string;
};

export type WizardClaimsData = {
  requests: string[];
  requested_outcome: string;
  include_calculation_summary: boolean;
  include_inconsistency_matrix: boolean;
  main_claims: string[];
  subsidiary_claims: string[];
  include_estimated_amount: boolean;
  include_oath_or_amount_statement: boolean;
  include_legal_basis: boolean;
};

export type WizardAttachmentsData = {
  selected_attachments: string[];
  missing_attachment_acknowledgements: string[];
};

export type LegalDraftWizardData = {
  claimant: WizardClaimantData;
  recipient: WizardRecipientData;
  facts: WizardFactsData;
  claims: WizardClaimsData;
  attachments: WizardAttachmentsData;
  acknowledgement_accepted: boolean;
};

export type CreateDraftRequest = {
  wizard_payload: LegalDraftWizardData;
};

export type CreateDraftResponse = {
  draft_id: string;
  action_id: string;
  status: LegalDraftStatus;
};

export type UpdateDraftRequest = {
  sections?: Array<{
    id: string;
    content_html: string;
  }>;
  document_metadata?: Record<string, unknown>;
};

export type RegenerateSectionRequest = {
  instruction: string;
};

export type ExportDraftRequest = {
  format: "pdf" | "docx";
};

export type SubmitReviewRequest = {
  note?: string;
};

export type AdminLegalDraftSummary = {
  id: string;
  case_id: string;
  case_number: string;
  user_name: string;
  title: string;
  action_type: LegalActionType;
  status: LegalDraftStatus;
  quality_score?: number;
  professional_review_level: ProfessionalReviewLevel;
  review_required: boolean;
  updated_at: string;
};

export type AdminLegalDraftsResponse = {
  items: AdminLegalDraftSummary[];
  total: number;
};

export type AdminReviewDecision = "approve" | "request_changes" | "reject";

export type AdminReviewDecisionRequest = {
  decision: AdminReviewDecision;
  note: string;
};
