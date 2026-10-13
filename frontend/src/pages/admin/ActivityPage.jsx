import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function ActivityPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/notifications")
      .then((res) => setItems(res.data.notifications || []))
      .catch((err) => setError(err.response?.data?.message || "Could not load activity"));
  }, []);

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-semibold">System activity</h1>
      <p className="mb-6 text-sm text-slate-400">
        In-app copies of review emails. With no Resend key, the same text is printed in the API terminal and appended to backend/emails.log.
      </p>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {items.length === 0 ? (
        <div className="card p-8 text-slate-400">No notifications yet. Submit a project for review to generate one.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n._id} className="card p-4">
              <p className="font-medium">{n.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-400">{n.body}</p>
              {n.project && (
                <Link className="mt-2 inline-block text-xs text-accent-400" to={`/projects/${n.project._id || n.project}`}>
                  Open project
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
