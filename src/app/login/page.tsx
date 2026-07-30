"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid credentials or age not verified");
      return;
    }
    const next = search.get("callbackUrl") || "/personas";
    router.replace(next);
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Log in</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          className="w-full border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3"
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3"
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--accent)] px-4 py-3 text-[var(--bg)] disabled:opacity-50"
        >
          {loading ? "…" : "Continue"}
        </button>
      </form>
      <p className="mt-6 text-sm text-[var(--muted)]">
        No account?{" "}
        <Link href="/age-gate" className="text-[var(--accent)]">
          Register
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
