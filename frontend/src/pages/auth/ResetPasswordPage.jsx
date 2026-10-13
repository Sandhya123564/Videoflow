import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../services/api";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/reset", { token, password });
      setInfo(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="font-display text-2xl font-semibold">Choose a new password</h1>
      <form onSubmit={onSubmit} className="card mt-6 space-y-4 p-6">
        {error && <p className="text-sm text-rose-300">{error}</p>}
        {info && <p className="text-sm text-emerald-200">{info}</p>}
        <input className="input" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn-primary w-full" type="submit">Update password</button>
      </form>
      <Link className="mt-4 text-sm text-accent-400" to="/login">Sign in</Link>
    </div>
  );
}
