import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { homeFor } from "../../utils/roles";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(token ? "working" : "idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!token) return;
    api
      .post("/auth/verify", { token })
      .then((res) => {
        localStorage.setItem("vf_token", res.data.token);
        setStatus("ok");
        setTimeout(() => window.location.assign(homeFor(res.data.user.role)), 800);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed");
      });
  }, [token]);

  async function resend(e) {
    e.preventDefault();
    const { data } = await api.post("/auth/resend-verification", { email });
    setMessage(data.emailDelivery?.message || data.message);
  }

  if (user && status !== "working") {
    return <p className="p-8 text-slate-400">Already signed in.</p>;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="font-display text-2xl font-semibold">Verify email</h1>
      {status === "working" && <p className="mt-3 text-slate-400">Confirming your address…</p>}
      {status === "ok" && <p className="mt-3 text-emerald-200">Verified. Redirecting…</p>}
      {status === "error" && <p className="mt-3 text-rose-300">{message}</p>}
      {status !== "working" && status !== "ok" && (
        <form onSubmit={resend} className="card mt-6 space-y-3 p-5">
          <p className="text-sm text-slate-400">Need a new link? Enter your email.</p>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button className="btn-primary w-full" type="submit">Resend verification</button>
          {message && <p className="text-xs text-slate-400">{message}</p>}
        </form>
      )}
      <Link className="mt-6 text-sm text-accent-400" to="/login">Back to sign in</Link>
    </div>
  );
}
