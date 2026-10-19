import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Clapperboard,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { homeFor } from "../../utils/roles";
import NotificationBell from "./NotificationBell";

const NAV = {
  editor: [
    { to: "/editor", label: "Projects" },
    { to: "/editor/new", label: "New project" },
  ],
  reviewer: [{ to: "/reviewer", label: "Assigned reviews" }],
  head: [
  { to: "/head", label: "Final queue" },
  { to: "/change-password", label: "Change Password" },
],
  admin: [
    { to: "/admin", label: "Users" },
    { to: "/admin/activity", label: "Activity" },
    { to: "/notifications", label: "Inbox" },
  ],
};

const ROLE_LABELS = {
  editor: "Video Editor",
  reviewer: "Content Reviewer",
  head: "Review Head",
  admin: "Administrator",
};
function NavigationLinks({ links, closeMenu = () => {} }) {
  return links.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to.split("/").length <= 2}
      onClick={closeMenu}
      className={({ isActive }) =>
        [
          "flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold",
          isActive
            ? "border border-indigo-400/20 bg-indigo-500/15 text-indigo-200 shadow-[inset_3px_0_0_#818cf8]"
            : "border border-transparent text-slate-400 hover:border-white/5 hover:bg-white/[0.05] hover:text-white",
        ].join(" ")
      }
    >
      {item.label}
    </NavLink>
  ));
}
export default function AppShell() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = NAV[user?.role] || [];

  return (
    <div className="relative min-h-screen text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/[0.09] bg-[#080b14]/85 shadow-lg shadow-black/10 backdrop-blur-2xl">
        <div className="mx-auto flex min-h-[76px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <NavLink
            to={homeFor(user?.role)}
            className="group flex min-w-0 items-center gap-3"
            onClick={() => setMobileOpen(false)}
          >
            <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-indigo-300/25 bg-gradient-to-br from-indigo-500 via-blue-600 to-violet-700 text-white shadow-lg shadow-indigo-950/50">
              <Clapperboard size={22} strokeWidth={1.8} />
              <span className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/15" />
            </span>

            <span className="min-w-0">
              <span className="block truncate font-display text-xl font-bold tracking-tight text-white">
                VideoFlow
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.19em] text-slate-500">
                <Sparkles size={10} className="text-indigo-400" />
                Studio workflow
              </span>
            </span>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            <NavigationLinks links={links} />
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <NotificationBell />

            <div className="hidden items-center gap-3 border-l border-white/10 pl-4 lg:flex">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-indigo-300/20 bg-indigo-500/10 text-sm font-bold uppercase text-indigo-200">
                {(user?.name || "U").trim().charAt(0)}
              </span>
              <span className="max-w-[150px]">
                <span className="block truncate text-sm font-semibold text-slate-100">
                  {user?.name || "User"}
                </span>
                <span className="block text-xs text-slate-500">
                  {ROLE_LABELS[user?.role] || user?.role}
                </span>
              </span>
            </div>

            <button
              className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-medium text-slate-300 hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200 sm:flex"
              onClick={logout}
              type="button"
              title="Log out"
            >
              <LogOut size={16} />
              <span className="hidden xl:inline">Log out</span>
            </button>
         <button
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/10 md:hidden"
              type="button"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/[0.08] bg-[#0b1020]/95 px-4 py-4 shadow-2xl backdrop-blur-2xl md:hidden">
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-500/15 font-bold uppercase text-indigo-200">
                {(user?.name || "U").trim().charAt(0)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">
                  {user?.name || "User"}
                </span>
                <span className="text-xs text-slate-500">
                  {ROLE_LABELS[user?.role] || user?.role}
                </span>
              </span>
            </div>

            <nav className="grid gap-1">
              <NavigationLinks
                links={links}
                closeMenu={() => setMobileOpen(false)}
              />
            </nav>

            <button
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/[0.07] px-4 py-3 text-sm font-semibold text-rose-200 hover:bg-rose-500/15"
              type="button"
              onClick={logout}
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto min-h-[calc(100vh-76px)] max-w-[1600px] px-4 py-7 sm:px-6 sm:py-9 lg:px-10 lg:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-white/[0.07] bg-[#080b14]/50 px-4 py-5 text-center text-xs text-slate-600">
        VideoFlow Studio · Manage, review and publish with confidence
      </footer>
    </div>
  );
}