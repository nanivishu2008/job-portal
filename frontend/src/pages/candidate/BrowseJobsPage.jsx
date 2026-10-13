import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { Search, MapPin, Briefcase, DollarSign, X, CheckCircle, Sparkles, Building2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function BrowseJobsPage() {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [applyingJob, setApplyingJob] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/jobs", {
        params: { search, jobType, experienceLevel },
      });
      setJobs(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [jobType, experienceLevel]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    const format = (num) => "₹" + Number(num).toLocaleString("en-IN");
    if (min && max) return `${format(min)} - ${format(max)}`;
    if (min) return `From ${format(min)}`;
    return `Up to ${format(max)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Direct Hiring
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Discover Your Next Career Move
        </h1>
        <p className="text-slate-500 text-base">
          Explore verified openings at leading startups and enterprise teams
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm mb-10 flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by role, stack (React, Node), or company..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex gap-2">
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 font-semibold outline-none cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="remote">Remote</option>
            <option value="internship">Internship</option>
          </select>

          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 font-semibold outline-none cursor-pointer"
          >
            <option value="">All Experience</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
          </select>

          <button
            onClick={fetchJobs}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition shadow-sm"
          >
            Search
          </button>
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 font-medium">Loading opportunities...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No jobs match your filter</h3>
          <p className="text-slate-500 text-sm mb-4">Try clearing your filters to see all available openings.</p>
          <button
            onClick={() => { setSearch(""); setJobType(""); setExperienceLevel(""); }}
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="job-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Header Tag Ribbon */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 uppercase tracking-wide">
                    {job.job_type}
                  </span>
                  {job.experience_level && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                      {job.experience_level}
                    </span>
                  )}
                </div>

                {/* Job Title & Company */}
                <h2 className="text-xl font-bold text-slate-900 mb-1">{job.title}</h2>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 mb-4">
                  <Building2 className="w-4 h-4" />
                  <span>{job.company}</span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 line-clamp-3 mb-6 leading-relaxed">
                  {job.description}
                </p>
              </div>

              {/* Card Footer */}
              <div>
                {formatSalary(job.salary_min, job.salary_max) && (
                  <p className="text-xs font-bold text-emerald-600 mb-3">
                    💰 {formatSalary(job.salary_min, job.salary_max)}
                  </p>
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location || "Remote"}
                  </span>
                  <button
                    onClick={() => setApplyingJob(job)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Apply Modal */}
      {applyingJob && (
        <ApplyModal job={applyingJob} onClose={() => setApplyingJob(null)} />
      )}
    </div>
  );
}

function ApplyModal({ job, onClose }) {
  const { user } = useAuth();
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ error: "", success: "" });

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user) {
      setStatusMsg({ error: "Please log in as a candidate to apply.", success: "" });
      return;
    }
    if (user.role !== "candidate") {
      setStatusMsg({ error: "Only candidates can apply to jobs.", success: "" });
      return;
    }

    setLoading(true);
    setStatusMsg({ error: "", success: "" });

    try {
      const formData = new FormData();
      formData.append("jobId", job.id);
      formData.append("coverLetter", coverLetter);
      if (resume) formData.append("resume", resume);

      await axios.post("/api/applications", formData);
      setStatusMsg({ error: "", success: "Application submitted successfully!" });
      setTimeout(onClose, 1500);
    } catch (err) {
      setStatusMsg({
        error: err.response?.data?.message || "Failed to submit application.",
        success: "",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-2xl font-bold text-slate-900 mb-1">Apply for {job.title}</h3>
        <p className="text-sm font-semibold text-indigo-600 mb-6">{job.company}</p>

        {statusMsg.error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
            {statusMsg.error}
          </div>
        )}
        {statusMsg.success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4" />
            {statusMsg.success}
          </div>
        )}

        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Cover Letter / Introduction
            </label>
            <textarea
              rows="4"
              required
              className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Why are you a great match for this role?"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Resume (PDF only, max 5MB)
            </label>
            <input
              type="file"
              accept=".pdf"
              className="w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              onChange={(e) => setResume(e.target.files[0])}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-sm disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
