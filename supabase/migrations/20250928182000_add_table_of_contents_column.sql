-- Add table_of_contents column to existing blogs table
DO $$ 
BEGIN
    -- Add the column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blogs' AND column_name = 'table_of_contents'
    ) THEN
        ALTER TABLE blogs ADD COLUMN table_of_contents TEXT;
        
        -- Add index for better performance
        CREATE INDEX idx_blogs_table_of_contents 
        ON blogs (table_of_contents) 
        WHERE table_of_contents IS NOT NULL;
        
        -- Add comment
        COMMENT ON COLUMN blogs.table_of_contents IS 'JSON string containing the table of contents items generated from blog content';
        
        RAISE NOTICE 'Added table_of_contents column to blogs table';
    ELSE
        RAISE NOTICE 'table_of_contents column already exists in blogs table';
    END IF;
END $$;
