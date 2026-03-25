import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/modules", label: "Modules", icon: BookOpen },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User },
];

export function Sidebar() {
  const { signOut, profile, user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-white border-r border-gray-200 transition-all duration-200 shrink-0",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-2.5 px-4 py-5 border-b border-gray-100",
          collapsed && "justify-center px-2",
        )}
      >
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <GraduationCap size={18} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-gray-900 text-base leading-tight">
            LearnCognition
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map(
          (
            { to, label, icon: NavIcon, end }, // eslint-disable-line no-unused-vars
          ) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  collapsed && "justify-center",
                )
              }
            >
              <NavIcon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ),
        )}
      </nav>

      {/* User + Sign Out */}
      <div
        className={cn(
          "px-2 py-3 border-t border-gray-100 space-y-0.5",
          collapsed && "flex flex-col items-center",
        )}
      >
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-gray-900 truncate">
              {profile?.full_name || user?.email?.split("@")[0]}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full",
            collapsed && "justify-center",
          )}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
