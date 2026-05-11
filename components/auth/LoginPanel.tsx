import { AuthErrorAlert } from "@/components/auth/AuthErrorAlert";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

export function LoginPanel({ error }: { error?: string | null }) {
  return (
    <div className="rounded-3xl border border-labora-ui/70 bg-white/90 p-8 shadow-panel backdrop-blur">
      <p className="mb-2 text-sm font-semibold text-labora-green">Labora</p>

      <h1 className="font-heading text-3xl font-semibold text-labora-deep">
        Ingresa a tu cuenta
      </h1>

      <p className="mt-2 text-sm leading-6 text-labora-gray">
        Accede para revisar tus expedientes, documentos e informes.
      </p>

      <div className="mt-6">
        <AuthErrorAlert error={error} />
      </div>

      <div className="mt-6">
        <GoogleLoginButton />
      </div>

      <p className="mt-6 text-xs leading-relaxed text-labora-gray">
        Al continuar, validaremos tu acceso mediante tu cuenta de Google. Los
        consentimientos legales de Labora se solicitaran en el siguiente paso.
      </p>
    </div>
  );
}
