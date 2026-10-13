CREATE TABLE IF NOT EXISTS candidates (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name    VARCHAR(150) NOT NULL,
  phone        VARCHAR(20),
  bio          TEXT,
  location     VARCHAR(100),
  linkedin_url VARCHAR(255),
  resume_path  VARCHAR(500),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates(user_id);

