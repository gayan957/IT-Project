import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 text-white shadow-lg">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center">
        {/* Logo / Brand */}
        <Link
          to="/"
          className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 bg-clip-text text-transparent drop-shadow"
        >
          Trash2Cash
        </Link>

        {/* Right side links */}
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-white shadow-sm transition"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white shadow-sm transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-cyan-100 shadow-sm transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white shadow-sm transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
