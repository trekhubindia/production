-- Create blogs table with table_of_contents column
CREATE TABLE IF NOT EXISTS blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT,
  content TEXT,
  image TEXT,
  author TEXT,
  category TEXT,
  read_time TEXT,
  status TEXT DEFAULT 'draft',
  table_of_contents TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table_of_contents column if it doesn't exist
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS table_of_contents TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at);
CREATE INDEX IF NOT EXISTS idx_blogs_table_of_contents ON blogs(table_of_contents) WHERE table_of_contents IS NOT NULL;

-- Enable RLS
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Create policies for blogs table
CREATE POLICY "Allow service role full access to blogs" ON blogs
  FOR ALL USING (current_setting('role') = 'postgres');

CREATE POLICY "Allow public read access to published blogs" ON blogs
  FOR SELECT USING (status = 'published');

-- Add comments
COMMENT ON TABLE blogs IS 'Blog posts with generated table of contents';
COMMENT ON COLUMN blogs.table_of_contents IS 'JSON string containing the table of contents items generated from blog content';
