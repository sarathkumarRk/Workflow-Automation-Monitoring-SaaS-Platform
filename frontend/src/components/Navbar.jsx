
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  Workflow,
  History,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";

function Navbar() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const token = localStorage.getItem("access_token");
  const role = (localStorage.getItem("user_role") || "USER").toUpperCase();
  const name = localStorage.getItem("user_name") || "User";
  const email = localStorage.getItem("user_email") || "";

  if (!token) return null;

  const isAdmin = role === "ADMIN";

  const navigation = isAdmin
    ? [
        {
          label: "Admin Dashboard",
          path: "/admin/dashboard",
          icon: LayoutDashboard,
        },
      ]
    : [
        {
          label: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          label: "Workflows",
          path: "/workflows",
          icon: Workflow,
        },
        {
          label: "Executions",
          path: "/executions",
          icon: History,
        },
      ];

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");

    closeMenus();
    toast.success("Logged out successfully.");
    navigate("/login", { replace: true });
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-indigo-50 text-indigo-700"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6"
      >
        {/* Brand */}
        <Link
          to={isAdmin ? "/admin/dashboard" : "/dashboard"}
          onClick={closeMenus}
          className="flex shrink-0 items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Activity size={23} />
          </div>

          <div>
            <span className="block text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              FlowMonitor
            </span>
            <span className="hidden text-xs text-slate-500 sm:block">
              Workflow Automation
            </span>
          </div>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/dashboard" || item.path === "/admin/dashboard"}
                className={navLinkClass}
              >
                <Icon size={17} />
                {item.label}
              </NavLink>
            );
          })}
        </div>

        {/* User profile */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-expanded={profileOpen}
            aria-label="Open user profile menu"
            className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-100"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
              {name.charAt(0).toUpperCase()}
            </div>

            <div className="hidden text-left xl:block">
              <p className="max-w-40 truncate text-sm font-semibold text-slate-800">
                {name}
              </p>
              <p className="text-xs text-slate-500">
                {isAdmin ? "Administrator" : "User"}
              </p>
            </div>

            <ChevronDown size={16} className="text-slate-500" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <div className="border-b border-slate-100 px-3 py-3">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {name}
                </p>

                <p className="mt-1 truncate text-xs text-slate-500">
                  {email || "Signed in"}
                </p>

                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                  {isAdmin && <ShieldCheck size={13} />}
                  {role}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
        >
          {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </nav>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
              {name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">
                {name}
              </p>
              <p className="text-xs text-slate-500">
                {isAdmin ? "Administrator" : "User"}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/dashboard" || item.path === "/admin/dashboard"}
                  onClick={closeMenus}
                  className={navLinkClass}
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-600 hover:bg-red-100"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      )}
    </header>
  );
}

export default Navbar;
