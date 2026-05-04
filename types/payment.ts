export interface Payment {
  id: string;
  caseId: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  amount: number;
  currency: string;
}
