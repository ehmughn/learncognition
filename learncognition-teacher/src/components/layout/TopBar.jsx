import { useLocation, Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const breadcrumbMap = {
  "/": "Dashboard",
  "/modules": "Modules",
  "/modules/new": "Create Module",
  "/analytics": "Analytics",
  "/profile": "Profile",
};

function getBreadcrumbs(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [{ label: "Dashboard", to: "/" }];
  let acc = "";
  for (const part of parts) {
    acc += `/${part}`;
    const label =
      breadcrumbMap[acc] ||
      (part === "new"
        ? "New"
        : part === "edit"
          ? "Edit"
          : decodeURIComponent(part));
    crumbs.push({ label, to: acc });
  }
  return crumbs;
}

export function TopBar() {
  const { pathname } = useLocation();
  const { profile, user } = useAuth();
  const crumbs = getBreadcrumbs(pathname);
  const initials = (profile?.full_name || user?.email || "T")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-200 shrink-0">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        {crumbs.map((c, i) => (
          <span key={c.to} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-300">/</span>}
            {i === crumbs.length - 1 ? (
              <span className="font-medium text-gray-900">{c.label}</span>
            ) : (
              <Link
                to={c.to}
                className="text-gray-500 hover:text-indigo-600 transition-colors"
              >
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors relative">
          <Bell size={18} />
        </button>
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
      </div>
    </header>
  );
}
