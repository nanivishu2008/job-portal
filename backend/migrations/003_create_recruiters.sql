CREATE TABLE IF NOT EXISTS recruiters (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name    VARCHAR(150) NOT NULL,
  company_website VARCHAR(255),
  contact_name    VARCHAR(150) NOT NULL,
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recruiters_user_id ON recruiters(user_id);

