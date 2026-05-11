const messages: Record<string, string> = {
  google_auth_failed: "No pudimos iniciar sesion con Google. Intentalo nuevamente.",
  google_auth_cancelled: "El inicio de sesion con Google fue cancelado.",
  invalid_state: "La sesion de autenticacion expiro o no es valida. Intentalo de nuevo.",
  expired_state: "La sesion de autenticacion expiro. Intentalo nuevamente.",
  used_state: "La solicitud de inicio de sesion ya fue utilizada. Intentalo nuevamente.",
  missing_code: "Google no devolvio la informacion necesaria para iniciar sesion.",
  token_exchange_failed: "No pudimos validar tu sesion con Google. Intentalo otra vez.",
  invalid_id_token: "No pudimos verificar tu identidad con Google.",
  email_not_verified: "Tu correo de Google no aparece verificado.",
  user_disabled: "Tu usuario esta desactivado. Contacta soporte.",
};

export function AuthErrorAlert({ error }: { error?: string | null }) {
  if (!error) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {messages[error] || "Ocurrio un error al iniciar sesion. Intentalo nuevamente."}
    </div>
  );
}
