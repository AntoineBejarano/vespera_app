"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [adultConsent, setAdultConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          ageConfirmed,
          adultConsent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) throw new Error("Account created, but login failed");
      router.replace("/personas/new");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">
        Create account
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Private. 18+. Your chats are not used for training by default.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          className="w-full border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          minLength={8}
          placeholder="Password (min 8)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
          />
          I am 18 or older
        </label>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={adultConsent}
            onChange={(e) => setAdultConsent(e.target.checked)}
          />
          I accept consensual adult content and the ban on minors
        </label>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading || !ageConfirmed || !adultConsent}
          className="w-full bg-[var(--accent)] py-3 text-[var(--bg)] disabled:opacity-40"
        >
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--accent)]">
          Log in
        </Link>
      </p>
    </main>
  );
}
