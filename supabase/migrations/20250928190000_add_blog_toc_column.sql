-- Add table_of_contents column to blogs table
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS table_of_contents TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_blogs_table_of_contents 
ON blogs (table_of_contents) 
WHERE table_of_contents IS NOT NULL;

-- Add comment
COMMENT ON COLUMN blogs.table_of_contents IS 'JSON string containing the table of contents items generated from blog content';
