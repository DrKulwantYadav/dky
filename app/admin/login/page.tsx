import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin/auth";
import { login } from "../actions";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAdmin()) redirect("/admin");
  const { error } = await searchParams;
  const errorMessage = error
    ? {
        invalid_credentials: "The email is correct, but Supabase did not accept the password. Use the exact password set for this Auth user.",
        email_not_confirmed: "This email address has not been confirmed in Supabase yet.",
        rate_limited: "Supabase has temporarily limited authentication attempts. Please wait before trying again.",
        connection_failed: "The website could not reach Supabase. Please try again in a moment.",
      }[error] || "Sign-in could not be completed. Please try again."
    : null;
  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-brand-mark">GY</div>
        <p className="admin-eyebrow">Gopinath Hospital</p>
        <h1>Admin CRM</h1>
        <p>Secure access for authorized hospital staff.</p>
        {errorMessage && <div className="admin-alert error">{errorMessage}</div>}
        <form action={login} className="admin-form">
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
          <button className="admin-primary-button" type="submit">Sign in</button>
        </form>
        <Link href="/">Return to website</Link>
      </section>
    </main>
  );
}
