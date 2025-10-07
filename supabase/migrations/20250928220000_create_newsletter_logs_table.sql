-- Create newsletter_logs table to track newsletter sends
CREATE TABLE IF NOT EXISTS newsletter_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
    blog_title VARCHAR(255) NOT NULL,
    subscribers_count INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    failed_emails JSONB DEFAULT '[]',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_blog_id ON newsletter_logs(blog_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_sent_at ON newsletter_logs(sent_at);

-- Add RLS (Row Level Security)
ALTER TABLE newsletter_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Allow admin to view newsletter logs" ON newsletter_logs
    FOR SELECT USING (true);

CREATE POLICY "Allow admin to insert newsletter logs" ON newsletter_logs
    FOR INSERT WITH CHECK (true);

-- Add comment
COMMENT ON TABLE newsletter_logs IS 'Tracks newsletter email sends for blog posts';
