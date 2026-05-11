import { Bot, ShieldCheck, UserCheck } from "lucide-react";

export function LegalNotice() {
  return (
    <div className="rounded-lg border border-labora-ui bg-white p-5 text-sm leading-6 text-labora-gray">
      <strong className="font-semibold text-labora-charcoal">Alcance:</strong> Labora entrega
      orientacion inicial y analisis asistido sobre informacion laboral y pensional. Los
      resultados pueden requerir validacion profesional antes de una actuacion formal.
    </div>
  );
}

export function AITransparencyBanner() {
  return (
    <div className="rounded-lg border border-labora-mint bg-labora-mint/20 p-5">
      <div className="flex gap-3">
        <Bot className="mt-1 h-5 w-5 flex-none text-labora-deep" aria-hidden="true" />
        <p className="text-sm leading-6 text-labora-deep">
          Usamos IA asistida para organizar informacion y acelerar el analisis, pero las
          decisiones relevantes deben apoyarse en reglas verificables y revision humana cuando
          aplique.
        </p>
      </div>
    </div>
  );
}

export function HumanReviewCallout() {
  return (
    <div className="rounded-lg border border-labora-ui bg-white p-5">
      <div className="flex gap-3">
        <UserCheck className="mt-1 h-5 w-5 flex-none text-labora-green" aria-hidden="true" />
        <p className="text-sm leading-6 text-labora-gray">
          Para revisar tu caso concreto debes crear un expediente y aceptar las autorizaciones
          correspondientes.
        </p>
      </div>
    </div>
  );
}

export function SecurityChecklist({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 rounded-lg border border-labora-ui bg-white p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-labora-green" aria-hidden="true" />
          <span className="text-sm leading-6 text-labora-gray">{item}</span>
        </li>
      ))}
    </ul>
  );
}
