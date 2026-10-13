import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [info, setInfo] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    const { data } = await api.post("/auth/forgot", { email });
    setInfo(data.emailDelivery?.message || data.message);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="font-display text-2xl font-semibold">Reset password</h1>
      <form onSubmit={onSubmit} className="card mt-6 space-y-4 p-6">
        <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Account email" />
        <button className="btn-primary w-full" type="submit">Send reset link</button>
        {info && <p className="text-sm text-slate-400">{info}</p>}
      </form>
      <Link className="mt-4 text-sm text-accent-400" to="/login">Back to sign in</Link>
    </div>
  );
}
