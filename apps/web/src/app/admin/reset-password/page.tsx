"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/**
 * Destino del link de recuperación generado por Admin API (`create_super_admin.mjs`,
 * backlog 409). El link llega con `#access_token=...&refresh_token=...` (implicit
 * grant) en el hash — `@supabase/ssr`'s browser client NO lo auto-detecta como sí
 * hacía el `supabase-js` clásico, así que esta página lo parsea manualmente y llama
 * `setSession()` para establecer la sesión temporal antes de permitir
 * `updateUser({password})`. El agente nunca ve ni elige el valor de la contraseña.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // `@supabase/ssr`'s browser client no auto-detecta el token del hash del link de
    // recovery (implicit grant) el mismo modo que el `supabase-js` clásico — se
    // parsea manualmente y se establece la sesión de forma explícita con setSession().
    // Envuelto en una función async propia (en vez de setState directo en el cuerpo
    // del efecto) para cumplir react-hooks/set-state-in-effect.
    async function establishSession() {
      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
      const params = new URLSearchParams(hash);
      const errorDescription = params.get("error_description");
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (errorDescription) {
        setError(decodeURIComponent(errorDescription.replace(/\+/g, " ")));
        return;
      }
      if (!accessToken || !refreshToken) {
        setError("This link is invalid or has expired. Ask for a new one.");
        return;
      }

      const client = createBrowserSupabaseClient();
      const { error: sessionError } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      window.history.replaceState(null, "", window.location.pathname);
      setReady(true);
    }

    establishSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const client = createBrowserSupabaseClient();
    const { error: updateError } = await client.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push("/admin");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="font-serif text-2xl font-semibold text-ink">Set your password</h1>

      {!ready && !error && <p className="mt-4 text-sm text-muted">Verifying link…</p>}

      {ready && (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-4 py-3 text-base text-ink focus-visible:border-primary"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-ink">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-4 py-3 text-base text-ink focus-visible:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-ink transition-colors duration-fast hover:bg-primary-hover disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Set password"}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
