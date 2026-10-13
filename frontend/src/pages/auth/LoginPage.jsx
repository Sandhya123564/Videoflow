import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Clapperboard } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { homeFor } from "../../utils/roles";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const nextPath = params.get("next");
  const [email, setEmail] = useState(params.get("email") || "editor@videoflow.local");
  const [password, setPassword] = useState("Password123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={nextPath || homeFor(user.role)} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const next = await login(email, password);
      navigate(nextPath || homeFor(next.role));
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-500/20 text-accent-400">
          <Clapperboard size={22} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold">VideoFlow</h1>
          <p className="text-sm text-slate-400">Sign in to continue review work</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="card space-y-4 p-6">
        {error && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn-primary w-full" disabled={busy} type="submit">
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm text-slate-400">
          New here?{" "}
          <Link className="text-accent-400 hover:underline" to="/register">
            Create an editor or reviewer account
          </Link>
        </p>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link className="text-slate-400 hover:underline" to="/forgot-password">Forgot password?</Link>
      </p>
      <p className="mt-6 text-center text-xs text-slate-500">
        Demo: admin@ / head@ / editor@ / reviewer@videoflow.local · Password123
      </p>
    </div>
  );
}
