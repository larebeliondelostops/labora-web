export type DocumentStatus =
  | "uploaded"
  | "validating"
  | "valid"
  | "valid_with_warnings"
  | "rejected"
  | "processing"
  | "processed";

export interface LaboraDocument {
  id: string;
  caseId: string;
  documentType: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  uploadedAt: string;
}
