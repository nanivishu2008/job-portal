const appModel = require('../models/application.model');
const jobModel = require('../models/job.model');

const applyForJob = async (req, res, next) => {
  try {
    const { jobId, coverLetter } = req.body;
    if (!jobId) return res.status(400).json({ success: false, message: 'jobId is required.' });

    const candidateId = await appModel.getCandidateIdByUserId(req.user.id);
    if (!candidateId) return res.status(403).json({ success: false, message: 'Candidate profile not found.' });

    const job = await jobModel.getJobById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (job.status !== 'open') return res.status(400).json({ success: false, message: 'This job is no longer accepting applications.' });

    const existing = await appModel.getExistingApplication(jobId, candidateId);
    if (existing) return res.status(409).json({ success: false, message: 'You have already applied for this job.' });

    const resumePath = req.file ? `/uploads/${req.file.filename}` : null;
    const application = await appModel.createApplication({ jobId, candidateId, coverLetter, resumePath });

    res.status(201).json({ success: true, message: 'Application submitted successfully!', data: application });
  } catch (err) { next(err); }
};

const getMyApplications = async (req, res, next) => {
  try {
    const candidateId = await appModel.getCandidateIdByUserId(req.user.id);
    if (!candidateId) return res.status(403).json({ success: false, message: 'Candidate profile not found.' });
    const applications = await appModel.getApplicationsByCandidate(candidateId);
    res.json({ success: true, count: applications.length, data: applications });
  } catch (err) { next(err); }
};

const withdrawApplication = async (req, res, next) => {
  try {
    const candidateId = await appModel.getCandidateIdByUserId(req.user.id);
    if (!candidateId) return res.status(403).json({ success: false, message: 'Candidate profile not found.' });
    const withdrawn = await appModel.withdrawApplication(req.params.id, candidateId);
    if (!withdrawn) return res.status(404).json({ success: false, message: 'Application not found or unauthorized.' });
    res.json({ success: true, message: 'Application withdrawn successfully.' });
  } catch (err) { next(err); }
};

// --- Recruiter actions ---

const getJobApplicants = async (req, res, next) => {
  try {
    const recruiterId = await jobModel.getRecruiterIdByUserId(req.user.id);
    if (!recruiterId) return res.status(403).json({ success: false, message: 'Recruiter profile not found.' });

    const applicants = await appModel.getApplicantsForJob(req.params.jobId, recruiterId);
    res.json({ success: true, count: applicants.length, data: applicants });
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['applied', 'under_review', 'shortlisted', 'rejected', 'hired'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
    }

    const recruiterId = await jobModel.getRecruiterIdByUserId(req.user.id);
    if (!recruiterId) return res.status(403).json({ success: false, message: 'Recruiter profile not found.' });

    const updated = await appModel.updateApplicationStatus(req.params.id, recruiterId, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Application not found or you do not own this job listing.' });
    }

    res.json({ success: true, message: `Application status updated to ${status}.`, data: updated });
  } catch (err) { next(err); }
};

const getCandidateDetail = async (req, res, next) => {
  try {
    const profile = await appModel.getCandidateProfile(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Candidate not found.' });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

module.exports = {
  applyForJob,
  getMyApplications,
  withdrawApplication,
  getJobApplicants,
  updateStatus,
  getCandidateDetail
};
