import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "./StatusBadge";
import VideoPlayer from "../../components/video/VideoPlayer";
import { formatBytes } from "../../utils/media";
import { formatTimestamp } from "../../utils/time";
import YouTubePublishPanel from "../../components/youtube/YouTubePublishPanel";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const [project, setProject] = useState(null);
  const [versions, setVersions] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [publishing, setPublishing] = useState([]);
  const [comments, setComments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [driveLink, setDriveLink] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [commentBody, setCommentBody] = useState("");
  const [manualTime, setManualTime] = useState("0");
  const [playhead, setPlayhead] = useState(0);
  const [decisionNote, setDecisionNote] = useState("");

  const canEdit =
    user?.role === "admin" ||
    (user?.role === "editor" &&
      project?.editor &&
      (project.editor._id === user.id || project.editor === user.id));

  const isReviewer =
    user?.role === "admin" ||
    user?.role === "reviewer";

  const isHead = user?.role === "head" || user?.role === "admin";

  async function load() {
    const { data } = await api.get(`/projects/${id}`);
    setProject(data.project);
    setVersions(data.versions || []);
    setApprovals(data.approvals || []);
    setPublishing(data.publishing || []);
    const current = data.project.currentVersion || data.versions?.[0] || null;
    setSelected(current);
    const versionId = current?._id;
    const commentsRes = await api.get(`/projects/${id}/comments`, {
      params: versionId ? { versionId } : {},
    });
    setComments(commentsRes.data.comments || data.comments || []);
  }

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.message || "Could not load project"));
  }, [id]);

  useEffect(() => {
    if (!selected?._id) return;
    api
      .get(`/projects/${id}/comments`, { params: { versionId: selected._id } })
      .then((res) => setComments(res.data.comments || []))
      .catch(() => {});
  }, [selected?._id, id]);

  const versionComments = useMemo(
    () => comments.filter((c) => !selected || c.version === selected._id || c.version?._id === selected._id),
    [comments, selected]
  );

  async function addVersion(e) {
    e.preventDefault();
    setError("");
    if (!file && !driveLink.trim()) {
      setError("Attach a video or paste a Drive link.");
      return;
    }
    setBusy(true);
    try {
      const data = new FormData();
      data.append("notes", notes);
      if (driveLink.trim()) data.append("driveLink", driveLink.trim());
      if (file) data.append("video", file);
      await api.post(`/projects/${id}/versions`, data);
      setFile(null);
      setDriveLink("");
      setNotes("");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add version");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await api.post(`/projects/${id}/submit`, {});
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not send for review");
    } finally {
      setBusy(false);
    }
  }

  async function addComment(e) {
    e.preventDefault();
    setError("");
    const seconds =
      selected?.sourceType === "gdrive" ? Number(manualTime) : playhead;
    setBusy(true);
    try {
      await api.post(`/projects/${id}/comments`, {
        versionId: selected?._id,
        timestampSeconds: seconds,
        body: commentBody,
      });
      setCommentBody("");
      const res = await api.get(`/projects/${id}/comments`, {
        params: { versionId: selected?._id },
      });
      setComments(res.data.comments || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not add comment");
    } finally {
      setBusy(false);
    }
  }

  async function resolveComment(comment, resolved) {
    await api.patch(`/projects/${id}/comments/${comment._id}`, { resolved });
    const res = await api.get(`/projects/${id}/comments`, {
      params: { versionId: selected?._id },
    });
    setComments(res.data.comments || []);
  }

  async function decide(path, action) {
    setBusy(true);
    setError("");
    try {
      await api.post(`/projects/${id}${path}`, { action, note: decisionNote });
      setDecisionNote("");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Decision failed");
    } finally {
      setBusy(false);
    }
  }

  function seekTo(seconds) {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play?.();
    }
  }

  if (!project && !error) {
    return <p className="text-slate-400">Loading project…</p>;
  }

  const canSubmit =
    canEdit &&
    project &&
    project.currentVersion &&
    ["draft", "changes_requested", "changes_requested_by_head"].includes(project.status);

  const canReviewerDecide = isReviewer && project?.status === "pending_review";
  const canHeadDecide = isHead && project?.status === "pending_head_review";
  const canLeaveComment =
    user &&
    ["reviewer", "head", "admin", "editor"].includes(user.role) &&
    selected;

  const backTo =
    user?.role === "reviewer" ? "/reviewer" : user?.role === "head" ? "/head" : "/editor";

  return (
    <div className="space-y-6">
      {/* Project header */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-400 transition hover:text-indigo-300"
              to={backTo}
            >
              ← Back to dashboard
            </Link>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">
                Video project
              </p>

              <h1 className="mt-1 truncate font-display text-2xl font-bold tracking-tight text-White sm:text-3xl">
                {project?.title}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                {project?.description || "No description provided for this project."}
              </p>
            </div>
          </div>

          {project && (
            <div className="shrink-0">
              <StatusBadge status={project.status} />
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>
      )}

      {project && (
        <>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
            <VideoPlayer version={selected} ref={videoRef} onTime={setPlayhead} />
            <div className="card space-y-4 p-5 text-sm text-slate-200 sm:p-6">
              <p><span className="text-slate-400">Reviewer:</span> {project.reviewerEmail}</p>
              <p><span className="text-slate-400">Editor:</span> {project.editor?.name}</p>
              <p><span className="text-slate-400">Versions:</span> {versions.length}</p>
              {selected && (
                <p>
                  <span className="text-slate-500">Playing:</span> v{selected.versionNumber} ({selected.sourceType})
                  {selected.sourceType !== "gdrive" ? ` · ${formatTimestamp(playhead)}` : ""}
                </p>
              )}
              {canSubmit && (
                <button className="btn-primary w-full" type="button" disabled={busy} onClick={submit}>
                  Send for review
                </button>
              )}
              {project.status === "changes_requested" && canEdit && (
                <p className="text-xs text-orange-200">Reviewer asked for edits. Upload a new version, then send for review.</p>
              )}
              {project.status === "changes_requested_by_head" && canEdit && (
                <p className="text-xs text-orange-200">Head asked for edits. Upload a new version, then send for review.</p>
              )}
              {project.status === "approved" && (
                <p className="text-xs text-emerald-200">Final approval recorded. The Head can publish to YouTube below.</p>
              )}
              {project.status === "published" && publishing[0]?.youtubeUrl && (
                <p className="text-xs text-violet-200">
                  Published {publishing[0].mode === "demo" ? "(demo)" : ""} · {publishing[0].youtubeVideoId}
                </p>
              )}

              {(canReviewerDecide || canHeadDecide) && (
                <div className="space-y-2 border-t border-white/10 pt-3">
                  <label className="label">Decision note</label>
                  <textarea className="input min-h-20" value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} placeholder="Required when requesting changes" />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="btn-primary"
                      type="button"
                      disabled={busy}
                      onClick={() => decide(canReviewerDecide ? "/review" : "/head-review", "approve")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-ghost"
                      type="button"
                      disabled={busy}
                      onClick={() => decide(canReviewerDecide ? "/review" : "/head-review", "request_changes")}
                    >
                      Request changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="mb-3 font-display text-xl font-semibold">Timestamp comments</h2>
              {canLeaveComment && (
                <form onSubmit={addComment} className="card mb-3 space-y-2 p-4">
                  {selected?.sourceType === "gdrive" ? (
                    <input className="input" type="number" min="0" step="1" value={manualTime} onChange={(e) => setManualTime(e.target.value)} placeholder="Seconds" />
                  ) : (
                    <p className="text-xs text-slate-500">Comment will use the current playhead ({formatTimestamp(playhead)}).</p>
                  )}
                  <input className="input" value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="What should change at this moment?" required />
                  <button className="btn-primary" disabled={busy} type="submit">Add comment</button>
                </form>
              )}
              {versionComments.length === 0 ? (
                <div className="card p-4 text-sm text-slate-400">No comments on this version yet.</div>
              ) : (
                <ul className="space-y-2">
                  {versionComments.map((c) => (
                    <li key={c._id} className="card p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <button type="button" className="font-medium text-accent-400" onClick={() => seekTo(c.timestampSeconds)}>
                          {formatTimestamp(c.timestampSeconds)}
                        </button>
                        <span className="text-xs text-slate-500">{c.authorName || c.author?.name}</span>
                      </div>
                      <p className={`mt-1 ${c.resolved ? "text-slate-500 line-through" : "text-slate-200"}`}>{c.body}</p>
                      {canEdit && (
                        <button className="mt-2 text-xs text-slate-400 hover:text-white" type="button" onClick={() => resolveComment(c, !c.resolved)}>
                          {c.resolved ? "Reopen" : "Mark resolved"}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h2 className="mb-3 font-display text-xl font-semibold">Version history</h2>
              {versions.length === 0 ? (
                <div className="card p-5 text-slate-400">No versions yet.</div>
              ) : (
                <ul className="grid gap-2">
                  {versions.map((v) => (
                    <li key={v._id}>
                      <button
                        type="button"
                        onClick={() => setSelected(v)}
                        className={`card w-full p-4 text-left ${selected?._id === v._id ? "ring-1 ring-accent-500" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">Version {v.versionNumber}</p>
                          <span className="text-xs uppercase text-slate-500">{v.storageProvider}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          {v.notes || v.originalFilename || v.driveUrl || "No notes"}
                          {v.fileSize ? ` · ${formatBytes(v.fileSize)}` : ""}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {canEdit && project.status !== "published" && project.status !== "approved" && (
            <form onSubmit={addVersion} className="card space-y-3 p-5">
              <h2 className="font-display text-lg font-semibold">Add a revised version</h2>
              <input className="input" type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <input className="input" placeholder="Or Google Drive link" value={driveLink} onChange={(e) => setDriveLink(e.target.value)} />
              <input className="input" placeholder="What changed in this version?" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <button className="btn-primary" disabled={busy} type="submit">
                {busy ? "Saving…" : "Save version"}
              </button>
            </form>
          )}

          {(project.status === "approved" || project.status === "published") && (
            <YouTubePublishPanel
              project={project}
              publishing={publishing}
              role={user?.role}
              onChanged={load}
            />
          )}

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold">Activity history</h2>
            {approvals.length === 0 ? (
              <div className="card p-4 text-sm text-slate-400">No review actions yet.</div>
            ) : (
              <ul className="space-y-2 text-sm text-slate-400">
                {approvals.map((a) => (
                  <li key={a._id} className="card p-3">
                    <span className="capitalize text-slate-200">{a.actorRole}</span>
                    {" · "}
                    {a.action.replaceAll("_", " ")}
                    {a.note ? ` — ${a.note}` : ""}
                    <span className="ml-2 text-xs text-slate-600">
                      {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
