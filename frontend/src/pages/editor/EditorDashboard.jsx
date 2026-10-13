import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import ProjectList from "../../components/projects/ProjectList";

export default function EditorDashboard() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Editor</p>
          <h1 className="font-display text-3xl font-semibold">Your projects</h1>
        </div>
        <Link className="btn-primary" to="/editor/new">
          <Plus size={16} /> New project
        </Link>
      </div>
      <ProjectList empty="No projects yet. Create one and assign a reviewer by email." />
    </div>
  );
}
