"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, RotateCcw, XCircle } from "lucide-react";

import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { InlineAlert, SkeletonCard } from "@/components/auth/FormFeedback";
import {
  useAdminLegalDraft,
  useAdminReviewDecision,
} from "@/src/modules/legal-actions/hooks/useLegalActions";
import { QualityChecklist } from "@/src/modules/legal-actions/components/QualityChecklist";
import { sanitizeDraftHtml } from "@/src/modules/legal-actions/utils/sanitizeDraftHtml";
import { draftStatusLabels } from "@/src/modules/legal-actions/utils/mapStatusToLabel";
import type { AdminReviewDecision } from "@/src/modules/legal-actions/api/legal-actions.types";

export function AdminDraftReviewPage({ draftId }: { draftId: string }) {
  const draftResource = useAdminLegalDraft(draftId);
  const decision = useAdminReviewDecision(draftId);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const draft = draftResource.data;

  async function submitDecision(nextDecision: AdminReviewDecision) {
    setMessage(null);
    const updated = await decision.decide({
      decision: nextDecision,
      note,
    });
    setMessage("Decision registrada.");
    setNote("");
    draftResource.refresh();

    if (updated) {
      // The refresh keeps server truth, while this avoids a stale empty state.
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <AdminSidebar />
        <section className="space-y-5">
          <header className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <Link
              href="/admin/legal-drafts"
              className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep hover:text-labora-green"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Borradores juridicos
            </Link>
            <h1 className="mt-4 font-heading text-3xl font-semibold text-labora-charcoal">
              Revision del borrador
            </h1>
          </header>

          {draftResource.isLoading ? <SkeletonCard /> : null}

          {draftResource.error ? (
            <InlineAlert tone="error">{draftResource.error}</InlineAlert>
          ) : null}

          {message ? <InlineAlert tone="success">{message}</InlineAlert> : null}
          {decision.error ? <InlineAlert tone="error">{decision.error}</InlineAlert> : null}

          {draft ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <main className="space-y-5">
                <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-labora-green">
                    Documento
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold text-labora-charcoal">
                    {draft.title}
                  </h2>
                  <p className="mt-2 text-sm text-labora-gray">
                    {draftStatusLabels[draft.status]}
                    {draft.quality_score ? ` · calidad ${draft.quality_score}` : ""}
                  </p>
                </section>

                {draft.sections.map((section) => (
                  <article
                    key={section.id}
                    className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel"
                  >
                    <h3 className="font-heading text-lg font-semibold text-labora-charcoal">
                      {section.title}
                    </h3>
                    <div
                      className="prose prose-sm mt-4 max-w-none text-labora-charcoal"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeDraftHtml(section.content_html),
                      }}
                    />
                  </article>
                ))}
              </main>

              <aside className="space-y-5">
                {draft.quality ? (
                  <QualityChecklist
                    overallStatus={draft.quality.overall_status}
                    score={draft.quality.score}
                    checks={draft.quality.checks}
                  />
                ) : null}

                <section className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
                  <h2 className="font-heading text-lg font-semibold text-labora-charcoal">
                    Decision de revision
                  </h2>
                  <label className="mt-4 block">
                    <span className="text-sm font-semibold text-labora-charcoal">
                      Nota de revision
                    </span>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      className="mt-2 min-h-32 w-full rounded-lg border border-labora-ui px-3 py-2 text-sm leading-6 outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-green/15"
                    />
                  </label>
                  <div className="mt-4 grid gap-2">
                    <button
                      type="button"
                      onClick={() => submitDecision("approve")}
                      disabled={decision.isLoading}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-labora-green px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => submitDecision("request_changes")}
                      disabled={decision.isLoading}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-labora-ui px-4 py-2 text-sm font-semibold text-labora-deep hover:bg-labora-ivory disabled:text-labora-gray"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      Solicitar cambios
                    </button>
                    <button
                      type="button"
                      onClick={() => submitDecision("reject")}
                      disabled={decision.isLoading}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:text-red-300"
                    >
                      <XCircle className="h-4 w-4" aria-hidden="true" />
                      Rechazar
                    </button>
                  </div>
                </section>
              </aside>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
