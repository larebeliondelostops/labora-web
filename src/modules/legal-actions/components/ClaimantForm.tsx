import type { WizardClaimantData } from "@/src/modules/legal-actions/api/legal-actions.types";

type ClaimantFormProps = {
  value: WizardClaimantData;
  errors?: Partial<Record<keyof WizardClaimantData, string>>;
  onChange: (value: WizardClaimantData) => void;
};

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

const inputClass =
  "min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 py-2 text-sm text-labora-charcoal outline-none focus:border-labora-green focus:ring-2 focus:ring-labora-green/15";

export function ClaimantForm({ value, errors = {}, onChange }: ClaimantFormProps) {
  function update<K extends keyof WizardClaimantData>(
    key: K,
    nextValue: WizardClaimantData[K],
  ) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <section className="grid gap-4 rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
      <div>
        <h2 className="font-heading text-xl font-semibold text-labora-charcoal">
          Datos del solicitante
        </h2>
        <p className="mt-1 text-sm leading-6 text-labora-gray">
          Estos datos se usaran para identificar a quien presenta el escrito.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre completo" error={errors.claimant_name}>
          <input
            value={value.claimant_name}
            onChange={(event) => update("claimant_name", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Tipo de documento" error={errors.claimant_document_type}>
          <select
            value={value.claimant_document_type}
            onChange={(event) => update("claimant_document_type", event.target.value)}
            className={inputClass}
          >
            <option value="CC">Cedula de ciudadania</option>
            <option value="CE">Cedula de extranjeria</option>
            <option value="PA">Pasaporte</option>
            <option value="NIT">NIT</option>
            <option value="OTHER">Otro</option>
          </select>
        </Field>
        <Field label="Numero de documento" error={errors.claimant_document_number}>
          <input
            value={value.claimant_document_number}
            onChange={(event) => update("claimant_document_number", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Correo electronico" error={errors.claimant_email}>
          <input
            type="email"
            value={value.claimant_email}
            onChange={(event) => update("claimant_email", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Telefono">
          <input
            value={value.claimant_phone}
            onChange={(event) => update("claimant_phone", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Ciudad" error={errors.claimant_city}>
          <input
            value={value.claimant_city}
            onChange={(event) => update("claimant_city", event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Direccion de notificacion" error={errors.claimant_address}>
        <input
          value={value.claimant_address}
          onChange={(event) => update("claimant_address", event.target.value)}
          className={inputClass}
        />
      </Field>

      <label className="flex items-start gap-3 rounded-lg border border-labora-ui bg-labora-ivory p-3 text-sm text-labora-charcoal">
        <input
          type="checkbox"
          checked={value.acts_on_behalf_of_third_party}
          onChange={(event) =>
            update("acts_on_behalf_of_third_party", event.target.checked)
          }
          className="mt-1 h-4 w-4 rounded border-labora-ui text-labora-green"
        />
        Actuo en nombre de un tercero
      </label>

      {value.acts_on_behalf_of_third_party ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre del representante" error={errors.representative_name}>
            <input
              value={value.representative_name}
              onChange={(event) => update("representative_name", event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field
            label="Documento del representante"
            error={errors.representative_document}
          >
            <input
              value={value.representative_document}
              onChange={(event) =>
                update("representative_document", event.target.value)
              }
              className={inputClass}
            />
          </Field>
        </div>
      ) : null}
    </section>
  );
}
