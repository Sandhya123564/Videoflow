const STYLES = {
  draft: "bg-slate-500/20 text-slate-300",
  pending_review: "bg-amber-500/20 text-amber-200",
  changes_requested: "bg-orange-500/20 text-orange-200",
  pending_head_review: "bg-sky-500/20 text-sky-200",
  changes_requested_by_head: "bg-orange-500/20 text-orange-200",
  approved: "bg-emerald-500/20 text-emerald-200",
  published: "bg-violet-500/20 text-violet-200",
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        STYLES[status] || "bg-white/10 text-slate-300"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
