import type { Metadata } from "next";

import { ProfessionalReviewsInboxPage } from "@/src/modules/professional-review/pages/ProfessionalReviewsInboxPage";

export const metadata: Metadata = {
  title: "Revisiones profesionales",
  description: "Bandeja operativa de revisiones profesionales.",
};

export default function BackofficeProfessionalReviewsRoute() {
  return <ProfessionalReviewsInboxPage />;
}
