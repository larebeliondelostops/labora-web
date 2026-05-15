export type QuestionnaireStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "blocked"
  | "requires_review"
  | "error";

export type QuestionType =
  | "text"
  | "textarea"
  | "radio"
  | "checkbox"
  | "select"
  | "date"
  | "number"
  | "money"
  | "file_reference"
  | "yes_no";

export type AnswerSource =
  | "user"
  | "prefill"
  | "document_extraction"
  | "ai_suggestion"
  | "admin";

export type QuestionValue = string | number | boolean | string[] | null;

export interface QuestionnaireSession {
  id: string;
  status: QuestionnaireStatus;
  completionPercentage: number;
  currentSection?: string | null;
}

export interface QuestionnaireTemplate {
  code: string;
  version: number;
}

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface QuestionValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  requiredMessage?: string;
}

export interface Answer {
  id: string;
  value: unknown;
  source: AnswerSource;
  confidence?: number | null;
  requiresReview?: boolean;
  updatedAt?: string;
}

export interface Question {
  id: string;
  code: string;
  label: string;
  helpText?: string;
  type: QuestionType;
  required: boolean;
  visible: boolean;
  isCritical: boolean;
  options?: QuestionOption[];
  validation?: QuestionValidation;
  answer?: Answer | null;
}

export interface QuestionnaireSection {
  code: string;
  title: string;
  description?: string;
  order: number;
  visible: boolean;
  questions: Question[];
}

export interface CaseProfilePreview {
  hasPublicSectorWork?: boolean | null;
  hasTeacherHistory?: boolean | null;
  hasSpecialRegimeSignal?: boolean | null;
  hasMissingWeeksClaim?: boolean | null;
  hasReliquidationSignal?: boolean | null;
  requiresReview?: boolean;
  confidence?: number | null;
  missingDocuments?: string[];
}

export interface QuestionnaireResponse {
  caseId: string;
  session: QuestionnaireSession;
  template: QuestionnaireTemplate;
  sections: QuestionnaireSection[];
  profilePreview?: CaseProfilePreview;
}

export interface SaveAnswersRequest {
  sessionId: string;
  answers: Array<{
    questionCode: string;
    value: unknown;
  }>;
  clientRequestId: string;
}

export interface QuestionnaireWarning {
  code: string;
  message: string;
}

export interface SaveAnswersResponse {
  saved: boolean;
  session: QuestionnaireSession;
  changedQuestions: string[];
  newlyVisibleQuestions?: string[];
  hiddenQuestions?: string[];
  profilePreview?: CaseProfilePreview;
  warnings?: QuestionnaireWarning[];
}

export interface SubmitQuestionnaireRequest {
  sessionId: string;
  confirmAccuracy: boolean;
}

export interface SubmitQuestionnaireResponse {
  status: "completed" | "requires_review";
  completedAt: string;
  profile: CaseProfilePreview & {
    caseId: string;
    currentStatus?: string;
    criticalFacts?: string[];
  };
  nextStep?: {
    code: string;
    label: string;
    href?: string;
  };
}

export interface AdminQuestionnaireDecisionPayload {
  action:
    | "approve"
    | "mark_requires_review"
    | "reject"
    | "request_clarification";
  comment?: string;
}
