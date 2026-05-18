import type {
  LegalDraftWizardData,
  WizardAttachmentsData,
  WizardClaimantData,
  WizardClaimsData,
  WizardFactsData,
  WizardRecipientData,
} from "@/src/modules/legal-actions/api/legal-actions.types";

export function createEmptyClaimantData(): WizardClaimantData {
  return {
    claimant_name: "",
    claimant_document_type: "CC",
    claimant_document_number: "",
    claimant_email: "",
    claimant_phone: "",
    claimant_address: "",
    claimant_city: "",
    acts_on_behalf_of_third_party: false,
    representative_name: "",
    representative_document: "",
  };
}

export function createEmptyRecipientData(): WizardRecipientData {
  return {
    recipient_entity: "",
    recipient_area: "",
    recipient_city: "",
    recipient_email: "",
    recipient_address: "",
    defendant_name: "",
    defendant_type: "",
  };
}

export function createEmptyFactsData(): WizardFactsData {
  return {
    selected_facts: [],
    edited_facts: {},
    additional_facts: "",
  };
}

export function createEmptyClaimsData(): WizardClaimsData {
  return {
    requests: [],
    requested_outcome: "",
    include_calculation_summary: true,
    include_inconsistency_matrix: true,
    main_claims: [],
    subsidiary_claims: [],
    include_estimated_amount: false,
    include_oath_or_amount_statement: false,
    include_legal_basis: true,
  };
}

export function createEmptyAttachmentsData(): WizardAttachmentsData {
  return {
    selected_attachments: [],
    missing_attachment_acknowledgements: [],
  };
}

export function createEmptyWizardData(): LegalDraftWizardData {
  return {
    claimant: createEmptyClaimantData(),
    recipient: createEmptyRecipientData(),
    facts: createEmptyFactsData(),
    claims: createEmptyClaimsData(),
    attachments: createEmptyAttachmentsData(),
    acknowledgement_accepted: false,
  };
}

export function buildWizardPayload(data: LegalDraftWizardData): LegalDraftWizardData {
  return {
    claimant: {
      ...data.claimant,
      claimant_name: data.claimant.claimant_name.trim(),
      claimant_document_number: data.claimant.claimant_document_number.trim(),
      claimant_email: data.claimant.claimant_email.trim(),
      claimant_phone: data.claimant.claimant_phone.trim(),
      claimant_address: data.claimant.claimant_address.trim(),
      claimant_city: data.claimant.claimant_city.trim(),
      representative_name: data.claimant.representative_name.trim(),
      representative_document: data.claimant.representative_document.trim(),
    },
    recipient: {
      ...data.recipient,
      recipient_entity: data.recipient.recipient_entity.trim(),
      recipient_area: data.recipient.recipient_area.trim(),
      recipient_city: data.recipient.recipient_city.trim(),
      recipient_email: data.recipient.recipient_email.trim(),
      recipient_address: data.recipient.recipient_address.trim(),
      defendant_name: data.recipient.defendant_name.trim(),
      defendant_type: data.recipient.defendant_type.trim(),
    },
    facts: {
      selected_facts: data.facts.selected_facts,
      edited_facts: Object.fromEntries(
        Object.entries(data.facts.edited_facts).map(([key, value]) => [
          key,
          value.trim(),
        ]),
      ),
      additional_facts: data.facts.additional_facts.trim(),
    },
    claims: {
      ...data.claims,
      requests: data.claims.requests.map((item) => item.trim()).filter(Boolean),
      requested_outcome: data.claims.requested_outcome.trim(),
      main_claims: data.claims.main_claims.map((item) => item.trim()).filter(Boolean),
      subsidiary_claims: data.claims.subsidiary_claims
        .map((item) => item.trim())
        .filter(Boolean),
    },
    attachments: data.attachments,
    acknowledgement_accepted: data.acknowledgement_accepted,
  };
}
