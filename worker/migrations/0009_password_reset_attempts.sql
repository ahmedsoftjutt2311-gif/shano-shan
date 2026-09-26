-- Harden password reset challenges against brute-forcing the (very small) answer space.
ALTER TABLE password_reset_challenges ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;

-- Basic brute-force throttling for login.
CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  success INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON login_attempts(email, created_at);
