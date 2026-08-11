import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="font-serif text-2xl font-semibold text-ink">Admin sign in</h1>
      <p className="mt-2 text-sm text-muted">Internal tool — accounts are provisioned directly, no public sign-up.</p>
      <LoginForm />
    </div>
  );
}
