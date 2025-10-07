-- Create trek_ratings table for user trek reviews and ratings
CREATE TABLE IF NOT EXISTS trek_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    trek_id UUID NOT NULL REFERENCES treks(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_title VARCHAR(200),
    review_text TEXT,
    photos TEXT[], -- Array of photo URLs
    verified_booking BOOLEAN DEFAULT true,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one rating per booking
    UNIQUE(booking_id),
    -- Ensure one rating per user per trek (in case of multiple bookings)
    UNIQUE(user_id, trek_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trek_ratings_user_id ON trek_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_trek_ratings_trek_id ON trek_ratings(trek_id);
CREATE INDEX IF NOT EXISTS idx_trek_ratings_booking_id ON trek_ratings(booking_id);
CREATE INDEX IF NOT EXISTS idx_trek_ratings_rating ON trek_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_trek_ratings_created_at ON trek_ratings(created_at);
CREATE INDEX IF NOT EXISTS idx_trek_ratings_verified ON trek_ratings(verified_booking);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_trek_ratings_trek_rating ON trek_ratings(trek_id, rating);
CREATE INDEX IF NOT EXISTS idx_trek_ratings_user_trek ON trek_ratings(user_id, trek_id);

-- Add RLS (Row Level Security)
ALTER TABLE trek_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read verified ratings
CREATE POLICY "Anyone can read trek ratings" ON trek_ratings
    FOR SELECT USING (verified_booking = true);

-- Policy: Service role has full access
CREATE POLICY "Service role full access to trek_ratings" ON trek_ratings
    FOR ALL USING (current_setting('role') = 'postgres');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trek_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trek_ratings_updated_at
    BEFORE UPDATE ON trek_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_trek_ratings_updated_at();

-- Create function to calculate average rating for a trek
CREATE OR REPLACE FUNCTION calculate_trek_average_rating(trek_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    avg_rating DECIMAL(3,2);
BEGIN
    SELECT ROUND(AVG(rating::DECIMAL), 2) INTO avg_rating
    FROM trek_ratings 
    WHERE trek_id = trek_uuid AND verified_booking = true;
    
    RETURN COALESCE(avg_rating, 0.00);
END;
$$ LANGUAGE plpgsql;

-- Create function to get rating count for a trek
CREATE OR REPLACE FUNCTION get_trek_rating_count(trek_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    rating_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO rating_count
    FROM trek_ratings 
    WHERE trek_id = trek_uuid AND verified_booking = true;
    
    RETURN COALESCE(rating_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to update trek average rating
CREATE OR REPLACE FUNCTION update_trek_average_rating()
RETURNS TRIGGER AS $$
DECLARE
    trek_uuid UUID;
    new_avg_rating DECIMAL(3,2);
BEGIN
    -- Get the trek_id from the rating record
    IF TG_OP = 'DELETE' THEN
        trek_uuid := OLD.trek_id;
    ELSE
        trek_uuid := NEW.trek_id;
    END IF;
    
    -- Calculate new average rating
    new_avg_rating := calculate_trek_average_rating(trek_uuid);
    
    -- Update the treks table
    UPDATE treks 
    SET rating = new_avg_rating,
        updated_at = NOW()
    WHERE id = trek_uuid;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update trek ratings
CREATE TRIGGER update_trek_rating_on_insert
    AFTER INSERT ON trek_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_trek_average_rating();

CREATE TRIGGER update_trek_rating_on_update
    AFTER UPDATE ON trek_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_trek_average_rating();

CREATE TRIGGER update_trek_rating_on_delete
    AFTER DELETE ON trek_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_trek_average_rating();

-- Add comments for documentation
COMMENT ON TABLE trek_ratings IS 'User ratings and reviews for completed treks';
COMMENT ON COLUMN trek_ratings.rating IS 'User rating from 1 to 5 stars';
COMMENT ON COLUMN trek_ratings.review_title IS 'Short title for the review';
COMMENT ON COLUMN trek_ratings.review_text IS 'Detailed review text';
COMMENT ON COLUMN trek_ratings.photos IS 'Array of photo URLs uploaded by user';
COMMENT ON COLUMN trek_ratings.verified_booking IS 'Whether this rating is from a verified booking';
COMMENT ON COLUMN trek_ratings.helpful_count IS 'Number of users who found this review helpful';
