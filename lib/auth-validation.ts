export interface PasswordRule {
  id: string;
  label: string;
  passed: boolean;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getPasswordRules(password: string, confirmPassword?: string): PasswordRule[] {
  const rules: PasswordRule[] = [
    {
      id: "length",
      label: "Minimo 10 caracteres",
      passed: password.length >= 10,
    },
    {
      id: "uppercase",
      label: "Una mayuscula",
      passed: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: "Una minuscula",
      passed: /[a-z]/.test(password),
    },
    {
      id: "number",
      label: "Un numero",
      passed: /\d/.test(password),
    },
    {
      id: "symbol",
      label: "Un simbolo",
      passed: /[^A-Za-z0-9]/.test(password),
    },
  ];

  if (confirmPassword !== undefined) {
    rules.push({
      id: "match",
      label: "Coincide con la confirmacion",
      passed: password.length > 0 && password === confirmPassword,
    });
  }

  return rules;
}

export function getPasswordScore(password: string): number {
  return getPasswordRules(password).filter((rule) => rule.passed).length;
}

export function isStrongPassword(password: string): boolean {
  return getPasswordRules(password).every((rule) => rule.passed);
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  const visible = name.slice(0, 2);

  return `${visible}${"*".repeat(Math.max(name.length - 2, 3))}@${domain}`;
}

export function cleanDocumentNumber(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

export function getNextAuthPath(nextStep?: string): string {
  if (nextStep === "verify_otp") {
    return "/verificar-otp";
  }

  if (nextStep === "dashboard") {
    return "/app/dashboard";
  }

  if (nextStep === "profile") {
    return "/app/perfil";
  }

  return "/consentimientos";
}
