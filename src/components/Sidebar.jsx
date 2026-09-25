import { NavLink, Link, useNavigate } from "react-router-dom";
import { useApp } from "../App";

const mainLinks = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/careers", label: "Careers", icon: "🎯" },
  { to: "/learning-history", label: "Learning History", icon: "📜" },
  { to: "/assessment", label: "Assessment", icon: "📝" },
  { to: "/skill-gaps", label: "Skill Gaps", icon: "📉" },
  { to: "/skill-profile", label: "Skill Profile", icon: "🧬" },
  { to: "/roadmap", label: "Roadmap", icon: "🗺️" },
  { to: "/adaptive-roadmap", label: "Adaptive Roadmap", icon: "🔄" },
  { to: "/learning-insights", label: "AI Insights", icon: "💡" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

export default function Sidebar({ open, onClose }) {
  const { state, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    if (onClose) onClose();
    navigate("/login");
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-ink-950/40 z-40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-line z-50 lg:z-0 transition-transform lg:translate-x-0 flex flex-col ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-line shrink-0">
          <Link to="/dashboard" onClick={onClose} className="font-display font-extrabold text-ink-900 text-lg">
            SkillPath <span className="text-teal-600">AI</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 flex-1 overflow-y-auto space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold text-ink-400 uppercase tracking-wider">
            Navigation
          </div>
          {mainLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={onClose}
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2.5 focus-ring ${
                  isActive
                    ? "bg-teal-50 text-teal-800 font-semibold border border-teal-200/80"
                    : "text-ink-600 hover:bg-slate-50 hover:text-ink-900"
                }`
              }
            >
              <span className="text-base select-none">{l.icon}</span>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Account / SQLite Auth Footer */}
        <div className="p-3 border-t border-line bg-paper/60 shrink-0">
          {state.user ? (
            <div className="p-2 rounded-xl bg-white border border-line shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                  {state.user.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-ink-900 truncate">
                    {state.user.name}
                  </p>
                  <p className="text-[11px] text-ink-500 font-mono truncate">
                    {state.user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-line/60">
                <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">
                  Active Student
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold transition-colors"
                >
                  Log out →
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Link
                to="/login"
                onClick={onClose}
                className="w-full text-center block px-3 py-2 rounded-xl text-xs font-bold border border-line bg-white hover:bg-slate-50 text-ink-800 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="w-full text-center block px-3 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-2xs"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
