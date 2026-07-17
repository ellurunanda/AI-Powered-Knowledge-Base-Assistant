import { NavLink, Outlet } from "react-router-dom";
import { useToast } from "../../app/providers/use-toast";
import { getApiErrorMessage } from "../../lib/api/error";
import { useAuth } from "../../features/auth/use-auth";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/upload", label: "Upload" },
  { to: "/chat", label: "Chat" },
  { to: "/history", label: "History" },
  { to: "/search", label: "Search" },
];

export function MainLayout() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      showToast("Logged out successfully", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900">AI Knowledge Base Assistant</h1>
          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <span className="ml-2 text-sm text-slate-600">{user?.name}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
