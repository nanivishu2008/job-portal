-- Migration: 001_init.sql
-- Creates all Phase 1 tables in a single transaction.
-- Rollback: see bottom of file.

BEGIN;

-- ─── Migration tracking ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schema_migrations (
  id          SERIAL PRIMARY KEY,
  filename    VARCHAR(255) UNIQUE NOT NULL,
  applied_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Enable pgcrypto for gen_random_uuid() on PG < 13 ─────────────────────────
-- On PG ≥ 13 gen_random_uuid() is built-in; this is a no-op on those versions.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── updated_at trigger function ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email          VARCHAR(255) UNIQUE NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(20)  NOT NULL CHECK (role IN ('candidate', 'recruiter')),
  full_name      VARCHAR(255) NOT NULL,
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  email_verified BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_role_idx  ON users (role);

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── candidate_profiles ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID         UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  headline              VARCHAR(255),
  summary               TEXT,
  location              VARCHAR(255),
  phone                 VARCHAR(30),
  linkedin_url          VARCHAR(500),
  resume_filename       VARCHAR(255),
  resume_original_name  VARCHAR(255),
  resume_mimetype       VARCHAR(100),
  resume_size_bytes     INTEGER,
  resume_uploaded_at    TIMESTAMPTZ,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS candidate_profiles_updated_at ON candidate_profiles;
CREATE TRIGGER candidate_profiles_updated_at
  BEFORE UPDATE ON candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── recruiter_profiles ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recruiter_profiles (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID         UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name         VARCHAR(255) NOT NULL,
  company_website      VARCHAR(500),
  company_description  TEXT,
  company_logo_filename VARCHAR(255),
  industry             VARCHAR(100),
  company_size         VARCHAR(50),
  location             VARCHAR(255),
  phone                VARCHAR(30),
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS recruiter_profiles_updated_at ON recruiter_profiles;
CREATE TRIGGER recruiter_profiles_updated_at
  BEFORE UPDATE ON recruiter_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── jobs ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                VARCHAR(255)  NOT NULL,
  description          TEXT          NOT NULL,
  requirements         TEXT,
  location             VARCHAR(255),
  job_type             VARCHAR(50)   CHECK (job_type IN ('full-time','part-time','contract','internship','remote')),
  salary_min           NUMERIC(12,2),
  salary_max           NUMERIC(12,2),
  salary_currency      VARCHAR(10)   DEFAULT 'USD',
  experience_level     VARCHAR(50)   CHECK (experience_level IN ('entry','mid','senior','lead','executive')),
  status               VARCHAR(20)   NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed','draft')),
  application_deadline DATE,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS jobs_recruiter_idx   ON jobs (recruiter_id);
CREATE INDEX IF NOT EXISTS jobs_status_idx      ON jobs (status);
CREATE INDEX IF NOT EXISTS jobs_created_at_idx  ON jobs (created_at DESC);

DROP TRIGGER IF EXISTS jobs_updated_at ON jobs;
CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── applications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                   UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cover_letter             TEXT,
  status                   VARCHAR(30) NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','reviewing','shortlisted','rejected','hired')),
  resume_snapshot_filename VARCHAR(255),
  applied_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS applications_job_idx       ON applications (job_id);
CREATE INDEX IF NOT EXISTS applications_candidate_idx ON applications (candidate_id);

DROP TRIGGER IF EXISTS applications_updated_at ON applications;
CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;

-- ─── ROLLBACK (run manually if needed) ───────────────────────────────────────
-- DROP TABLE IF EXISTS applications;
-- DROP TABLE IF EXISTS jobs;
-- DROP TABLE IF EXISTS recruiter_profiles;
-- DROP TABLE IF EXISTS candidate_profiles;
-- DROP TABLE IF EXISTS users;
-- DROP TABLE IF EXISTS schema_migrations;
-- DROP FUNCTION IF EXISTS set_updated_at();
