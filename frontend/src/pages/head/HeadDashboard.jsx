import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import StatusBadge from "../shared/StatusBadge";

export default function HeadDashboard() {
  const [projects, setProjects] = useState([]);
  const [yt, setYt] = useState(null);
  const [params] = useSearchParams();
  const youtubeFlag = params.get("youtube");
  const youtubeMessage = params.get("message");

  useEffect(() => {
    api.get("/projects").then((res) => setProjects(res.data.projects || []));
    api.get("/youtube/status").then((res) => setYt(res.data)).catch(() => {});
  }, []);

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Head</p>
      <h1 className="mb-6 font-display text-3xl font-semibold">Final review queue</h1>

      {youtubeFlag === "connected" && (
        <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          YouTube account connected.
        </p>
      )}
      {youtubeFlag === "error" && (
        <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          YouTube connect failed{youtubeMessage ? `: ${youtubeMessage}` : ""}
        </p>
      )}

      {yt?.demoMode && (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          YouTube credentials are not set. Publishing uses labeled demo mode and does not upload a real video.
        </p>
      )}

      {projects.length === 0 ? (
        <div className="card p-8 text-slate-400">
          No reviewer-approved videos yet. When a reviewer approves a project it appears here.
        </div>
      ) : (
        <ul className="grid gap-3">
          {projects.map((p) => (
            <li key={p._id}>
              <Link to={`/projects/${p._id}`} className="card flex items-center justify-between p-4 hover:bg-white/[0.06]">
                <p className="font-medium">{p.title}</p>
                <StatusBadge status={p.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
