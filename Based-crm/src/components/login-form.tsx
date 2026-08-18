"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Notice } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Login failed");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error — is the server running?");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-4">
      {/* background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-brand-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 right-0 h-[400px] w-[400px] rounded-full bg-brand-400/20 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-black text-white shadow-lg shadow-brand-900/40">
            B
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Based CRM</h1>
          <p className="mt-1 text-sm text-ink-400">Your deals, contacts, and pipeline — in one place.</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur"
        >
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-300">
            Sign in
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-medium text-ink-300">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-white/15 bg-white/10 text-white placeholder:text-ink-500 focus:border-brand-400"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-medium text-ink-300">
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-white/15 bg-white/10 text-white placeholder:text-ink-500 focus:border-brand-400"
              />
            </div>
            {error ? <Notice>{error}</Notice> : null}
            <Button type="submit" disabled={loading} className="w-full py-2.5">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-ink-500">
          Demo login — <span className="text-ink-300">admin@basedcrm.com</span> /{" "}
          <span className="text-ink-300">based123</span>
        </p>
      </div>
    </div>
  );
}
