import React, { useState, useEffect } from "react";
import axios from "axios";
import { Briefcase, Calendar, Trash2 } from "lucide-react";

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    try {
      const res = await axios.get("/api/applications/my");
      setApplications(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleWithdraw = async (id) => {
    if (!window.confirm("Are you sure you want to withdraw this application?")) return;
    try {
      await axios.delete(`/api/applications/${id}`);
      setApplications(applications.filter((a) => a.id !== id));
    } catch (err) {
      alert("Failed to withdraw application.");
    }
  };

  const statusBadge = (status) => {
    const map = {
      applied: "bg-blue-50 text-blue-700 border-blue-200",
      under_review: "bg-amber-50 text-amber-700 border-amber-200",
      shortlisted: "bg-purple-50 text-purple-700 border-purple-200",
      hired: "bg-emerald-50 text-emerald-700 border-emerald-200",
      rejected: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${map[status] || "bg-slate-100"}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">My Applications</h1>
      <p className="text-slate-500 text-sm mb-8">Track the progress of your job applications in real time</p>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading your applications...</div>
      ) : applications.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <p className="text-slate-600 font-medium mb-4">You have not submitted any applications yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <h3 className="font-bold text-lg text-slate-900">{app.job_title}</h3>
                <p className="text-sm font-medium text-slate-600 mb-2">{app.job_company}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Applied: {new Date(app.applied_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {statusBadge(app.status)}
                <button
                  onClick={() => handleWithdraw(app.id)}
                  className="text-slate-400 hover:text-rose-600 transition"
                  title="Withdraw application"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
