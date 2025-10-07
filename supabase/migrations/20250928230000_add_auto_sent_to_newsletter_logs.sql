-- Add auto_sent column to newsletter_logs table to track automatic vs manual sends
ALTER TABLE newsletter_logs 
ADD COLUMN IF NOT EXISTS auto_sent BOOLEAN DEFAULT false;

-- Add index for auto_sent column for performance
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_auto_sent ON newsletter_logs(auto_sent);

-- Add comment for documentation
COMMENT ON COLUMN newsletter_logs.auto_sent IS 'Whether this newsletter was sent automatically when blog was published';
