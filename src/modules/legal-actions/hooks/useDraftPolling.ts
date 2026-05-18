import type {
  LegalDraft,
  LegalDraftStatus,
} from "@/src/modules/legal-actions/api/legal-actions.types";

const pollingDraftStatuses: LegalDraftStatus[] = [
  "generating",
  "quality_check_pending",
];

export function shouldPollDraft(draft?: LegalDraft | null) {
  if (!draft) {
    return false;
  }

  return (
    pollingDraftStatuses.includes(draft.status) ||
    draft.sections.some((section) => section.status === "generating") ||
    draft.exports.some((item) => item.status === "queued" || item.status === "processing")
  );
}
