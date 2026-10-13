import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Search, MapPin, Briefcase, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const [search, setSearch] = useState("");
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/api/jobs")
      .then((res) => setFeaturedJobs(res.data.data.slice(0, 3)))
      .catch((err) => console.error(err));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/jobs?search=${encodeURIComponent(search)}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-indigo-50/70 to-transparent py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase bg-indigo-100/70 px-3 py-1 rounded-full">
            Modern Recruitment Portal
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight mt-6 mb-6">
            Land your dream role. <br />
            <span className="text-indigo-600">Hire top engineering talent.</span>
          </h1>
          <p className="text-slate-600 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            A seamless recruitment management platform connecting ambitious candidates with world-class employers.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2 bg-white p-2 rounded-2xl shadow-lg border border-slate-200">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Job title, tech stack (e.g. React, Node.js), or company..."
                className="w-full text-sm outline-none text-slate-700"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium text-sm transition flex items-center gap-1.5"
            >
              Search Jobs
            </button>
          </form>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Featured Openings</h2>
            <p className="text-slate-500 text-sm">Discover recent roles posted by top companies</p>
          </div>
          <Link to="/jobs" className="text-indigo-600 font-semibold text-sm hover:underline flex items-center gap-1">
            View all jobs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid gap-4">
          {featuredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 transition shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <h3 className="font-bold text-lg text-slate-900">{job.title}</h3>
                <p className="text-slate-600 text-sm mb-3 font-medium">{job.company}</p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md">
                    <MapPin className="w-3.5 h-3.5" /> {job.location || "Remote"}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md capitalize">
                    <Briefcase className="w-3.5 h-3.5" /> {job.job_type}
                  </span>
                  {job.experience_level && (
                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md capitalize font-semibold">
                      {job.experience_level}
                    </span>
                  )}
                </div>
              </div>

              <Link
                to={`/jobs`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition text-center"
              >
                Apply Now
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
