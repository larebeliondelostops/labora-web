import type { Metadata } from "next";

import {
  Panel,
  Pill,
  SectionHeader,
} from "@/src/modules/admin/components/admin-ui";

export const metadata: Metadata = {
  title: "Configuracion administrativa",
  description: "Ajustes internos del backoffice.",
};

export default function AdminSettingsRoute() {
  return (
    <div className="grid gap-5">
      <SectionHeader
        eyebrow="Backoffice"
        title="Configuracion"
        body="Parametros operativos, permisos y politica de entrega."
      />
      <section className="grid gap-5 lg:grid-cols-3">
        <Panel>
          <Pill tone="green">Permisos</Pill>
          <h2 className="mt-4 font-heading text-xl font-semibold text-labora-charcoal">
            Roles administrativos
          </h2>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            Admin, reviewer, legal_reviewer y support tienen acceso segmentado por ruta.
          </p>
        </Panel>
        <Panel>
          <Pill tone="amber">Entrega</Pill>
          <h2 className="mt-4 font-heading text-xl font-semibold text-labora-charcoal">
            Pago al final
          </h2>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            Informes completos y escritos no se marcan entregables sin pago confirmado o desbloqueo autorizado.
          </p>
        </Panel>
        <Panel>
          <Pill tone="blue">Auditoria</Pill>
          <h2 className="mt-4 font-heading text-xl font-semibold text-labora-charcoal">
            Trazabilidad
          </h2>
          <p className="mt-2 text-sm leading-6 text-labora-gray">
            Las mutaciones administrativas quedan preparadas para registro de actor, estado anterior y nuevo.
          </p>
        </Panel>
      </section>
    </div>
  );
}
