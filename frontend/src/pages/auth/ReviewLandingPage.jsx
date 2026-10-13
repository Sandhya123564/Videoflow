import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function ReviewLandingPage() {
  const { token } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/review/${token}`)
      .then((res) => setInfo(res.data))
      .catch((err) => setError(err.response?.data?.message || "Invalid review link"));
  }, [token]);

  useEffect(() => {
    if (!user || !info) return;
    api
      .post(`/review/${token}/claim`)
      .then((res) => navigate(`/projects/${res.data.projectId}`))
      .catch((err) => setError(err.response?.data?.message || "This link is not for your account"));
  }, [user, info, token, navigate]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-display text-2xl font-semibold">Review link</h1>
        <p className="mt-3 text-rose-300">{error}</p>
        <Link className="mt-4 inline-block text-accent-400" to="/login">Sign in</Link>
      </div>
    );
  }

  if (!info) return <p className="p-8 text-slate-400">Checking review link…</p>;

  const registerTo = `/register?invite=&email=${encodeURIComponent(info.reviewerEmail)}&next=/review/${token}`;

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-display text-2xl font-semibold">{info.project.title}</h1>
      <p className="mt-3 text-slate-400">
        This secure link is for <span className="text-slate-200">{info.reviewerEmail}</span>.
        Sign in with that address to open the video. Other accounts cannot use this link.
      </p>
      <div className="mt-6 flex gap-3">
        <Link className="btn-primary" to={`/login?next=/review/${token}`}>
          Sign in to review
        </Link>
        {!info.registered && (
          <Link className="btn-ghost" to={registerTo}>
            Create reviewer account
          </Link>
        )}
      </div>
    </div>
  );
}
