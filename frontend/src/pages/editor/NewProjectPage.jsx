import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    reviewerEmail: "reviewer@videoflow.local",
    driveLink: "",
    notes: "",
    priority: "normal",
    deadline: "",
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (file && form.driveLink.trim()) {
      setError("Choose either a video file or a Drive link, not both.");
      return;
    }
    setBusy(true);
    try {
      const data = new FormData();
      data.append("title", form.title);
      data.append("description", form.description);
      data.append("reviewerEmail", form.reviewerEmail);
      data.append("notes", form.notes);
      data.append("priority", form.priority);
      if (form.deadline) data.append("deadline", form.deadline);
      if (form.driveLink.trim()) data.append("driveLink", form.driveLink.trim());
      if (file) data.append("video", file);
      const res = await api.post("/projects", data);
      navigate(`/projects/${res.data.project._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create project");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Editor</p>
      <h1 className="mb-6 font-display text-3xl font-semibold">New project</h1>
      <form onSubmit={onSubmit} className="card space-y-4 p-6">
        {error && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}
        <div>
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} required minLength={3} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-24" value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => set("priority", e.target.value)}>
              <option value="low">low</option>
              <option value="normal">normal</option>
              <option value="high">high</option>
              <option value="urgent">urgent</option>
            </select>
          </div>
          <div>
            <label className="label">Deadline</label>
            <input className="input" type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Reviewer email</label>
          <input className="input" type="email" value={form.reviewerEmail} onChange={(e) => set("reviewerEmail", e.target.value)} required />
          <p className="mt-1 text-xs text-slate-500">
            For local testing use reviewer@videoflow.local
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Upload a video</label>
            <input
              className="input file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-slate-200"
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <p className="mt-1 text-xs text-slate-500">MP4 / WebM / MOV up to 500 MB. Stored locally unless Cloudinary keys are set.</p>
          </div>
          <div>
            <label className="label">Or paste a Google Drive link</label>
            <input
              className="input"
              placeholder="https://drive.google.com/file/d/…/view"
              value={form.driveLink}
              onChange={(e) => set("driveLink", e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">File must be shared as “anyone with the link can view”.</p>
          </div>
        </div>
        <div>
          <label className="label">Version notes (optional)</label>
          <input className="input" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
        <button className="btn-primary" disabled={busy} type="submit">
          {busy ? "Creating…" : "Create project"}
        </button>
      </form>
    </div>
  );
}
