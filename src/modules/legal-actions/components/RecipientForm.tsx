import type {
  LegalActionType,
  WizardRecipientData,
} from "@/src/modules/legal-actions/api/legal-actions.types";
import { isJudicialAction } from "@/src/modules/legal-actions/utils/mapStatusToLabel";

type RecipientFormProps = {
  actionType: LegalActionType;
  value: WizardRecipientData;
  errors?: Partial<Record<keyof WizardRecipientData, string>>;
  onChange: (value: WizardRecipientData) => void;
};

const inputClass =
  "min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm text-labora-charcoal outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-green/15";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-labora-charcoal">{label}</span>
      <div className="mt-2">{children}</div>
      {error ? <p className="mt-1 text-xs font-medium text-red-700">{error}</p> : null}
    </label>
  );
}

export function RecipientForm({
  actionType,
  value,
  errors = {},
  onChange,
}: RecipientFormProps) {
  const judicial = isJudicialAction(actionType);

  function update<K extends keyof WizardRecipientData>(
    key: K,
    nextValue: WizardRecipientData[K],
  ) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <section className="grid gap-4 rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div>
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          {judicial ? "Demandado" : "Entidad destinataria"}
        </h2>
        <p className="mt-1 text-sm leading-6 text-labora-gray">
          {judicial
            ? "Identifica a la parte contra quien se dirigiria el borrador."
            : "Indica la entidad que recibira la peticion, reclamacion o recurso."}
        </p>
      </div>

      {judicial ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre del demandado" error={errors.defendant_name}>
            <input
              value={value.defendant_name}
              onChange={(event) => update("defendant_name", event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Tipo de demandado">
            <input
              value={value.defendant_type}
              onChange={(event) => update("defendant_type", event.target.value)}
              className={inputClass}
              placeholder="Entidad publica, fondo, empleador..."
            />
          </Field>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Entidad destinataria" error={errors.recipient_entity}>
          <input
            value={value.recipient_entity}
            onChange={(event) => update("recipient_entity", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Area o dependencia">
          <input
            value={value.recipient_area}
            onChange={(event) => update("recipient_area", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Ciudad" error={errors.recipient_city}>
          <input
            value={value.recipient_city}
            onChange={(event) => update("recipient_city", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Correo de notificacion">
          <input
            type="email"
            value={value.recipient_email}
            onChange={(event) => update("recipient_email", event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Direccion">
        <input
          value={value.recipient_address}
          onChange={(event) => update("recipient_address", event.target.value)}
          className={inputClass}
        />
      </Field>
    </section>
  );
}
