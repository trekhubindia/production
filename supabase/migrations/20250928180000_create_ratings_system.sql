-- Create trek_ratings table
CREATE TABLE IF NOT EXISTS trek_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    trek_id UUID NOT NULL REFERENCES treks(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    guide_rating INTEGER CHECK (guide_rating >= 1 AND guide_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    organization_rating INTEGER CHECK (organization_rating >= 1 AND organization_rating <= 5),
    would_recommend BOOLEAN DEFAULT true,
    trek_date DATE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, trek_id) -- One rating per user per trek
);

-- Create rating_helpful table for tracking helpful votes
CREATE TABLE IF NOT EXISTS rating_helpful (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rating_id UUID NOT NULL REFERENCES trek_ratings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(rating_id, user_id) -- One helpful vote per user per rating
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trek_ratings_trek_id ON trek_ratings(trek_id);
CREATE INDEX IF NOT EXISTS idx_trek_ratings_user_id ON trek_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_trek_ratings_rating ON trek_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_trek_ratings_created_at ON trek_ratings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trek_ratings_booking_id ON trek_ratings(booking_id);
CREATE INDEX IF NOT EXISTS idx_rating_helpful_rating_id ON rating_helpful(rating_id);
CREATE INDEX IF NOT EXISTS idx_rating_helpful_user_id ON rating_helpful(user_id);

-- Create function to update helpful_count
CREATE OR REPLACE FUNCTION update_rating_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE trek_ratings 
        SET helpful_count = helpful_count + 1 
        WHERE id = NEW.rating_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE trek_ratings 
        SET helpful_count = helpful_count - 1 
        WHERE id = OLD.rating_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for helpful count updates
DROP TRIGGER IF EXISTS trigger_update_helpful_count ON rating_helpful;
CREATE TRIGGER trigger_update_helpful_count
    AFTER INSERT OR DELETE ON rating_helpful
    FOR EACH ROW EXECUTE FUNCTION update_rating_helpful_count();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_trek_ratings_updated_at ON trek_ratings;
CREATE TRIGGER trigger_update_trek_ratings_updated_at
    BEFORE UPDATE ON trek_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE trek_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_helpful ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Public can read all ratings
CREATE POLICY "Public can read trek ratings" ON trek_ratings
    FOR SELECT USING (true);

-- Service role has full access
CREATE POLICY "Service role full access to trek ratings" ON trek_ratings
    FOR ALL USING (current_setting('role') = 'postgres');

-- Public can read helpful votes
CREATE POLICY "Public can read rating helpful" ON rating_helpful
    FOR SELECT USING (true);

-- Service role has full access to helpful votes
CREATE POLICY "Service role full access to rating helpful" ON rating_helpful
    FOR ALL USING (current_setting('role') = 'postgres');

-- Create view for trek rating statistics
CREATE OR REPLACE VIEW trek_rating_stats AS
SELECT 
    t.id as trek_id,
    t.slug as trek_slug,
    COUNT(tr.id) as total_ratings,
    ROUND(AVG(tr.rating), 2) as average_rating,
    ROUND(AVG(tr.difficulty_rating), 2) as average_difficulty,
    ROUND(AVG(tr.guide_rating), 2) as average_guide_rating,
    ROUND(AVG(tr.value_rating), 2) as average_value_rating,
    ROUND(AVG(tr.organization_rating), 2) as average_organization_rating,
    COUNT(CASE WHEN tr.rating = 5 THEN 1 END) as five_star_count,
    COUNT(CASE WHEN tr.rating = 4 THEN 1 END) as four_star_count,
    COUNT(CASE WHEN tr.rating = 3 THEN 1 END) as three_star_count,
    COUNT(CASE WHEN tr.rating = 2 THEN 1 END) as two_star_count,
    COUNT(CASE WHEN tr.rating = 1 THEN 1 END) as one_star_count,
    COUNT(CASE WHEN tr.would_recommend = true THEN 1 END) as recommend_count,
    ROUND(
        (COUNT(CASE WHEN tr.would_recommend = true THEN 1 END) * 100.0) / 
        NULLIF(COUNT(tr.id), 0), 
        1
    ) as recommend_percentage
FROM treks t
LEFT JOIN trek_ratings tr ON t.id = tr.trek_id
GROUP BY t.id, t.slug;
