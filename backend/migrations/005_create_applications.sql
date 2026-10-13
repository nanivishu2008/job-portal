CREATE TABLE IF NOT EXISTS applications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID        NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  status       VARCHAR(30) NOT NULL DEFAULT 'applied'
                           CHECK (status IN ('applied','under_review','shortlisted','rejected','hired')),
  cover_letter TEXT,
  resume_path  VARCHAR(500),
  applied_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_application UNIQUE (job_id, candidate_id)
);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);

