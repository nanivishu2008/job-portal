CREATE TABLE IF NOT EXISTS jobs (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id     UUID         NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
  title            VARCHAR(200) NOT NULL,
  company          VARCHAR(150) NOT NULL,
  location         VARCHAR(100),
  job_type         VARCHAR(50)  CHECK (job_type IN ('full-time','part-time','contract','remote','internship')),
  experience_level VARCHAR(50)  CHECK (experience_level IN ('entry','mid','senior','lead')),
  description      TEXT         NOT NULL,
  requirements     TEXT,
  salary_min       DECIMAL(10,2),
  salary_max       DECIMAL(10,2),
  status           VARCHAR(20)  NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','draft')),
  posted_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deadline         DATE
);
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

