import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { homeFor } from "../../utils/roles";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const inviteToken = params.get("invite") || "";
  const nextPath = params.get("next") || "";
  const [form, setForm] = useState({
    name: "",
    email: params.get("email") || "",
    password: "",
    role: "editor",
    inviteToken,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);

  useEffect(() => {
    if (!inviteToken) return;
    api
      .get(`/auth/invites/${inviteToken}`)
      .then((res) => setForm((f) => ({ ...f, email: res.data.email, role: res.data.role, inviteToken })))
      .catch(() => setError("This invitation is invalid or has expired"));
  }, [inviteToken]);

  if (user) return <Navigate to={nextPath || homeFor(user.role)} replace />;

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await register(form);
      if (result?.requiresVerification) {
        setPending(result);
        return;
      }
      navigate(nextPath || homeFor(result.role));
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  if (pending) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
        <h1 className="font-display text-2xl font-semibold">Check your email</h1>
        <p className="mt-3 text-slate-400">
          We prepared a verification link for {pending.email}. If Resend is not configured, open the API terminal or backend/emails.log and paste the link.
        </p>
        <Link className="btn-primary mt-6" to="/verify-email">Open verification page</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="mb-2 font-display text-2xl font-semibold">Create account</h1>
      <p className="mb-6 text-sm text-slate-400">
        {inviteToken
          ? "You were invited. Register with the invited email to join."
          : "Editors and reviewers can self-register. Head and admin accounts are invited by an admin."}
      </p>
      <form onSubmit={onSubmit} className="card space-y-4 p-6">
        {error && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>
        )}
        <div>
          <label className="label">Full name</label>
          <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required readOnly={Boolean(inviteToken)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} required />
        </div>
        {!inviteToken && (
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => set("role", e.target.value)}>
              <option value="editor">Video Editor</option>
              <option value="reviewer">Reviewer</option>
            </select>
          </div>
        )}
        <button className="btn-primary w-full" disabled={busy} type="submit">
          {busy ? "Creating…" : "Create account"}
        </button>
        <p className="text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link className="text-accent-400 hover:underline" to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
