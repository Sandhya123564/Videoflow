import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import api from "../../services/api";

export default function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const { data } = await api.get("/notifications");
        if (alive) setCount(data.unreadCount || 0);
      } catch {
        /* ignore */
      }
    }
    load();
    const id = setInterval(load, 20000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <Link to="/notifications" className="relative rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
      <Bell size={18} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent-500 px-1 text-[10px] font-semibold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
