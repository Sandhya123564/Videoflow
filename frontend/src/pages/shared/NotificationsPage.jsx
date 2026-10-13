import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [mode, setMode] = useState("");

  async function load() {
    const { data } = await api.get("/notifications");
    setItems(data.notifications || []);
  }

  useEffect(() => {
    load().catch(() => {});
    api.get("/health").then((res) => setMode(res.data.emailMode)).catch(() => {});
  }, []);

  async function mark(id) {
    await api.patch(`/notifications/${id}/read`);
    await load();
  }

  async function markAll() {
    await api.post("/notifications/read-all");
    await load();
  }

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Notifications</h1>
          {mode === "testing" && (
            <p className="mt-2 text-sm text-amber-200">
              Email testing mode: outbound mail is logged in the API terminal and backend/emails.log. Nothing is sent to a real inbox until RESEND_API_KEY is set.
            </p>
          )}
        </div>
        <button className="btn-ghost text-xs" type="button" onClick={markAll}>
          Mark all read
        </button>
      </div>
      {items.length === 0 ? (
        <div className="card p-8 text-slate-400">No notifications yet.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n._id} className={`card p-4 ${n.read ? "opacity-70" : ""}`}>
              <p className="font-medium">{n.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-400">{n.body}</p>
              <div className="mt-2 flex gap-3 text-xs">
                {n.project && (
                  <Link className="text-accent-400" to={`/projects/${n.project._id || n.project}`} onClick={() => mark(n._id)}>
                    Open project
                  </Link>
                )}
                {!n.read && (
                  <button className="text-slate-500" type="button" onClick={() => mark(n._id)}>
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
