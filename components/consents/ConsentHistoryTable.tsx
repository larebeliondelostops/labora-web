"use client";

import { FileText } from "lucide-react";

import {
  formatConsentDate,
  getConsentTypeLabel,
  getShortHash,
} from "@/lib/consent-content";
import type { ConsentHistoryItem } from "@/types/consent";

interface ConsentHistoryTableProps {
  items: ConsentHistoryItem[];
  onOpenDocument?: (item: ConsentHistoryItem) => void;
}

export function ConsentHistoryTable({ items, onOpenDocument }: ConsentHistoryTableProps) {
  if (!items.length) {
    return (
      <div className="rounded-lg border border-labora-ui bg-white p-5 text-sm text-labora-gray">
        Aun no hay consentimientos registrados.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="hidden overflow-hidden rounded-2xl border border-labora-ui bg-white md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-labora-ivory text-xs uppercase tracking-[0.12em] text-labora-gray">
            <tr>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Documento</th>
              <th className="px-4 py-3 font-semibold">Version</th>
              <th className="px-4 py-3 font-semibold">Fecha de aceptacion</th>
              <th className="px-4 py-3 font-semibold">Hash</th>
              <th className="px-4 py-3 font-semibold">Accion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-labora-ui">
            {items.map((item) => (
              <tr key={item.id} className="text-labora-charcoal">
                <td className="px-4 py-4">{getConsentTypeLabel(item.consentType)}</td>
                <td className="px-4 py-4">{item.documentTitle}</td>
                <td className="px-4 py-4">{item.version}</td>
                <td className="px-4 py-4">{formatConsentDate(item.acceptedAt)}</td>
                <td className="px-4 py-4 font-mono text-xs">
                  {getShortHash(item.evidenceHash || item.hashSha256)}
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => onOpenDocument?.(item)}
                    disabled={!onOpenDocument}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-labora-deep underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FileText className="h-4 w-4" />
                    Ver documento
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-labora-ui bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-labora-green">
              {getConsentTypeLabel(item.consentType)}
            </p>
            <h3 className="mt-2 font-heading text-lg font-semibold text-labora-charcoal">
              {item.documentTitle}
            </h3>
            <dl className="mt-3 grid gap-2 text-sm text-labora-gray">
              <div className="flex justify-between gap-4">
                <dt>Version</dt>
                <dd className="font-semibold text-labora-charcoal">{item.version}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Fecha</dt>
                <dd className="text-right">{formatConsentDate(item.acceptedAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Hash</dt>
                <dd className="font-mono text-xs">{getShortHash(item.evidenceHash || item.hashSha256)}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => onOpenDocument?.(item)}
              disabled={!onOpenDocument}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-labora-deep underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              Ver documento
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
