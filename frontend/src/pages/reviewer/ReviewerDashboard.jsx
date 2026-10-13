import ProjectList from "../../components/projects/ProjectList";

export default function ReviewerDashboard() {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reviewer</p>
      <h1 className="mb-6 font-display text-3xl font-semibold">Assigned reviews</h1>
      <ProjectList empty="Nothing assigned yet. When an editor uses your email, the project appears here." />
    </div>
  );
}
