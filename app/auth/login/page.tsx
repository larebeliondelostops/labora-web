import { Suspense } from "react";

import { LoginPanel } from "@/components/auth/LoginPanel";
import { LoginPanelWithSearch } from "@/components/auth/LoginPanelWithSearch";

export default function LoginPage() {
  return (
    <main className="min-h-screen px-6">
      <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center py-12">
        <Suspense fallback={<LoginPanel />}>
          <LoginPanelWithSearch />
        </Suspense>
      </section>
    </main>
  );
}
