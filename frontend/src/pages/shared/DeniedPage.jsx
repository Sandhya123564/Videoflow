import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { homeFor } from "../../utils/roles";

export default function DeniedPage() {
  const { user } = useAuth();
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 text-center">
      <h1 className="font-display text-3xl font-semibold">Access denied</h1>
      <p className="mt-3 text-slate-400">
        Your role ({user?.role || "guest"}) cannot open that page.
      </p>
      <Link className="btn-primary mx-auto mt-6" to={homeFor(user?.role)}>
        Back to my dashboard
      </Link>
    </div>
  );
}
