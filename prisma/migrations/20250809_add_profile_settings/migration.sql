-- Add profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    notifications JSONB DEFAULT '{"email": true, "push": false, "observations": true, "evaluations": true, "reminders": true}'::jsonb,
    display JSONB DEFAULT '{"theme": "light", "language": "km", "dateFormat": "DD/MM/YYYY", "timeFormat": "24"}'::jsonb,
    privacy JSONB DEFAULT '{"profileVisibility": "team", "showEmail": false, "showPhone": false}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for user_settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);