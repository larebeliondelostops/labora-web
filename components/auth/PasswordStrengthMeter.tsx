import { CheckCircle2, Circle } from "lucide-react";

import { getPasswordRules, getPasswordScore } from "@/lib/auth-validation";

export function PasswordStrengthMeter({
  password,
  confirmPassword,
}: {
  password: string;
  confirmPassword?: string;
}) {
  const rules = getPasswordRules(password, confirmPassword);
  const score = getPasswordScore(password);
  const width = `${Math.max(score, 1) * 20}%`;

  return (
    <div className="rounded-lg border border-labora-ui bg-labora-ivory p-4">
      <div className="h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-labora-green transition-all" style={{ width }} />
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {rules.map((rule) => (
          <li key={rule.id} className="flex items-center gap-2 text-xs text-labora-gray">
            {rule.passed ? (
              <CheckCircle2 className="h-4 w-4 text-labora-green" aria-hidden="true" />
            ) : (
              <Circle className="h-4 w-4" aria-hidden="true" />
            )}
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
