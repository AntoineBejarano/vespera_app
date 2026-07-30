import { Suspense } from "react";
import { LandingPage } from "@/components/LandingPage";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
          Loading…
        </div>
      }
    >
      <LandingPage />
    </Suspense>
  );
}
