import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  FolderKanban,
  SlidersHorizontal,
  CalendarDays,
  ArrowUpRight,
  ListFilter,
} from "lucide-react";
import api from "../../services/api";
import StatusBadge from "../../pages/shared/StatusBadge";

const STAT_STYLES = {
  total: "from-indigo-500/15 to-blue-500/5 text-indigo-200",
  draft: "from-slate-500/15 to-slate-500/5 text-slate-300",
  pending_review: "from-amber-500/15 to-amber-500/5 text-amber-200",
  approved: "from-emerald-500/15 to-emerald-500/5 text-emerald-200",
  published: "from-violet-500/15 to-violet-500/5 text-violet-200",
};

export default function ProjectList({ empty }) {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({});
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [error, setError] = useState("");

  async function load(next = {}) {
    const params = {
      q: next.q ?? q,
      status: next.status ?? status,
      priority: next.priority ?? priority,
    };

    Object.keys(params).forEach((key) => {
      if (!params[key]) delete params[key];
    });
const { data } = await api.get("/projects", { params });
    setProjects(data.projects || []);
    setStats(data.stats || {});
    setError("");
  }

  useEffect(() => {
    load().catch((err) =>
      setError(err.response?.data?.message || "Could not load projects")
    );
  }, []);

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Object.entries(stats).map(([key, value]) => (
          <div
            key={key}
            className={`rounded-2xl border border-white/[0.09] bg-gradient-to-br ${
              STAT_STYLES[key] || "from-sky-500/10 to-transparent text-sky-200"
            } p-4 shadow-lg shadow-black/10`}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold capitalize tracking-wide text-slate-400">
                {key.replaceAll("_", " ")}
              </span>
              <FolderKanban size={17} className="opacity-80" />
            </div>
            <p className="font-display text-3xl font-bold text-white">
              {value}
            </p>
          </div>
        ))}
      </div>
  <div className="card overflow-hidden">
        <div className="border-b border-white/[0.08] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
              <SlidersHorizontal size={19} />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-white">
                Project workspace
              </h2>
              <p className="text-xs text-slate-500">
                Search and filter your video projects
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                className="input pl-10"
                placeholder="Search project title..."
                aria-label="Search project title"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onBlur={() =>
                  load().catch((err) =>
                    setError(
                      err.response?.data?.message || "Could not load projects"
                    )
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    load().catch((err) =>
                      setError(
                        err.response?.data?.message ||
                          "Could not load projects"
                      )
                    );
                  }
                }}
              />
            </div>
  <div className="relative">
              <ListFilter
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <select
                className="input pl-10 capitalize"
                aria-label="Filter by status"
                value={status}
                onChange={(e) => {
                  const value = e.target.value;
                  setStatus(value);
                  load({ status: value }).catch((err) =>
                    setError(
                      err.response?.data?.message || "Could not load projects"
                    )
                  );
                }}
              >
                <option value="">All statuses</option>
                {[
                  "draft",
                  "pending_review",
                  "changes_requested",
                  "pending_head_review",
                  "changes_requested_by_head",
                  "approved",
                  "published",
                ].map((item) => (
                  <option key={item} value={item}>
                    {item.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
  <div className="relative">
              <SlidersHorizontal
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <select
                className="input pl-10 capitalize"
                aria-label="Filter by priority"
                value={priority}
                onChange={(e) => {
                  const value = e.target.value;
                  setPriority(value);
                  load({ priority: value }).catch((err) =>
                    setError(
                      err.response?.data?.message || "Could not load projects"
                    )
                  );
                }}
              >
                <option value="">All priorities</option>
                {["low", "normal", "high", "urgent"].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
<div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
          <p className="text-xs font-medium text-slate-400">
            {projects.length} {projects.length === 1 ? "project" : "projects"}{" "}
            displayed
          </p>
          <span className="text-xs text-slate-500">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Workspace
          </span>
        </div>

        {error && (
          <p className="mx-4 mb-4 rounded-xl border border-rose-400/20 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-200 sm:mx-5">
            {error}
          </p>
        )}
{projects.length === 0 ? (
          <div className="m-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-12 text-center sm:m-5">
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-indigo-400/15 bg-indigo-500/[0.08] text-indigo-300">
              <FolderKanban size={25} />
            </span>
            <h3 className="font-display text-lg font-semibold text-slate-200">
              No projects found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {empty || "Projects will appear here when they are available."}
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 px-4 pb-4 sm:px-5 sm:pb-5">
            {projects.map((project) => (
              <li key={project._id}>
                <Link
                  to={`/projects/${project._id}`}
                  className="group flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#0b1020]/65 p-4 hover:border-indigo-400/30 hover:bg-indigo-500/[0.06] sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-indigo-500/15 to-violet-500/10 text-indigo-300 group-hover:border-indigo-400/20">
                      <FolderKanban size={20} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-semibold text-slate-100 group-hover:text-indigo-200">
                        {project.title}
                      </h3>

                      <p className="mt-1 break-all text-xs text-slate-500">
                        {project.reviewerEmail || "No reviewer assigned"}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        {project.priority && (
                          <span className="capitalize">
                            Priority: {project.priority}
                          </span>
                        )}
                        {project.deadline && (
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={13} />
                            Due {new Date(project.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                      <StatusBadge status={project.status} />
                      <ArrowUpRight
                      size={18}
                      className="text-slate-600 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-300"
                      />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}