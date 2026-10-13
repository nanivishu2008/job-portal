import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Briefcase, PlusCircle, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:bg-indigo-700 transition">
            <Briefcase className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Talent<span className="text-indigo-600">Hub</span>
          </span>
        </Link>

        {/* Links */}
        <nav className="flex items-center gap-6">
          <Link
            to="/jobs"
            className={`text-sm font-semibold transition ${
              isActive("/jobs") ? "text-indigo-600 font-bold" : "text-slate-600 hover:text-indigo-600"
            }`}
          >
            Find Jobs
          </Link>

          {user?.role === "candidate" && (
            <Link
              to="/my-applications"
              className={`text-sm font-semibold transition ${
                isActive("/my-applications") ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600"
              }`}
            >
              My Applications
            </Link>
          )}

          {user?.role === "recruiter" && (
            <>
              <Link
                to="/recruiter/dashboard"
                className={`text-sm font-semibold transition ${
                  isActive("/recruiter/dashboard") ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600"
                }`}
              >
                Recruiter Dashboard
              </Link>
              <Link
                to="/recruiter/post-job"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Post a Job
              </Link>
            </>
          )}

          {user ? (
            <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3.5 py-2 transition"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition shadow-sm"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
