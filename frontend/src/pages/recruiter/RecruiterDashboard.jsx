import React, { useState, useEffect } from "react";
import axios from "axios";
import { Briefcase, Users, CheckCircle, Clock } from "lucide-react";

export default function RecruiterDashboard() {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, jobsRes] = await Promise.all([
          axios.get("/api/dashboard/recruiter"),
          axios.get("/api/jobs/recruiter/my"),
        ]);
        setStats(dashRes.data.data);
        setJobs(jobsRes.data.data);
        if (jobsRes.data.data.length > 0) {
          setSelectedJobId(jobsRes.data.data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedJobId) return;
    axios.get(`/api/applications/job/${selectedJobId}`)
      .then((res) => setApplicants(res.data.data))
      .catch((err) => console.error(err));
  }, [selectedJobId]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await axios.put(`/api/applications/${appId}/status`, { status: newStatus });
      setApplicants(applicants.map((a) => (a.application_id === appId ? { ...a, status: newStatus } : a)));
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Recruitment Dashboard</h1>
      <p className="text-slate-500 text-sm mb-8">Manage your posted jobs and review candidates</p>

      {/* KPI Stats */}
      {stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Briefcase className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Active Jobs</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.jobs?.active_jobs || 0}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Total Applicants</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.applicants?.total_applicants || 0}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Clock className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Shortlisted</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.applicants?.shortlisted || 0}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Hired</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.applicants?.hired || 0}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Job Selector + Applicants Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Job Applicants</h2>
            <p className="text-slate-500 text-xs">Select a job to view and manage candidate submissions</p>
          </div>
          <select
            value={selectedJobId || ""}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-slate-50 font-medium"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.total_applicants} applicants)
              </option>
            ))}
          </select>
        </div>

        {applicants.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No applicants for this job yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Cover Letter</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applicants.map((a) => (
                  <tr key={a.application_id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-900">{a.full_name}</p>
                      <p className="text-xs text-slate-400">{a.candidate_email}</p>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600">
                      {a.phone || "N/A"} <br />
                      <span className="text-slate-400">{a.location || "Remote"}</span>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500 max-w-xs truncate">
                      {a.cover_letter}
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={a.status}
                        onChange={(e) => handleStatusChange(a.application_id, e.target.value)}
                        className="text-xs font-semibold px-2 py-1 border border-slate-200 rounded-md bg-white capitalize"
                      >
                        <option value="applied">Applied</option>
                        <option value="under_review">Under Review</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      {a.resume_path && (
                        <a
                          href={a.resume_path}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-indigo-600 hover:underline"
                        >
                          View Resume
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
