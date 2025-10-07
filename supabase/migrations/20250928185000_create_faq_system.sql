-- Create trek_faqs table for questions and answers
CREATE TABLE IF NOT EXISTS trek_faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trek_id UUID NOT NULL REFERENCES treks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    is_answered BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    answered_by UUID REFERENCES auth_user(id) ON DELETE SET NULL,
    answered_at TIMESTAMP WITH TIME ZONE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    category VARCHAR(50) DEFAULT 'general',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create faq_votes table for tracking user votes on FAQs
CREATE TABLE IF NOT EXISTS faq_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    faq_id UUID NOT NULL REFERENCES trek_faqs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(faq_id, user_id) -- One vote per user per FAQ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trek_faqs_trek_id ON trek_faqs(trek_id);
CREATE INDEX IF NOT EXISTS idx_trek_faqs_user_id ON trek_faqs(user_id);
CREATE INDEX IF NOT EXISTS idx_trek_faqs_is_answered ON trek_faqs(is_answered);
CREATE INDEX IF NOT EXISTS idx_trek_faqs_is_approved ON trek_faqs(is_approved);
CREATE INDEX IF NOT EXISTS idx_trek_faqs_is_featured ON trek_faqs(is_featured);
CREATE INDEX IF NOT EXISTS idx_trek_faqs_category ON trek_faqs(category);
CREATE INDEX IF NOT EXISTS idx_trek_faqs_created_at ON trek_faqs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_faq_votes_faq_id ON faq_votes(faq_id);
CREATE INDEX IF NOT EXISTS idx_faq_votes_user_id ON faq_votes(user_id);

-- Create function to update vote counts
CREATE OR REPLACE FUNCTION update_faq_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'upvote' THEN
            UPDATE trek_faqs SET upvotes = upvotes + 1 WHERE id = NEW.faq_id;
        ELSE
            UPDATE trek_faqs SET downvotes = downvotes + 1 WHERE id = NEW.faq_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle vote type change
        IF OLD.vote_type = 'upvote' AND NEW.vote_type = 'downvote' THEN
            UPDATE trek_faqs SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = NEW.faq_id;
        ELSIF OLD.vote_type = 'downvote' AND NEW.vote_type = 'upvote' THEN
            UPDATE trek_faqs SET downvotes = downvotes - 1, upvotes = upvotes + 1 WHERE id = NEW.faq_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'upvote' THEN
            UPDATE trek_faqs SET upvotes = upvotes - 1 WHERE id = OLD.faq_id;
        ELSE
            UPDATE trek_faqs SET downvotes = downvotes - 1 WHERE id = OLD.faq_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote count updates
DROP TRIGGER IF EXISTS trigger_update_faq_vote_counts ON faq_votes;
CREATE TRIGGER trigger_update_faq_vote_counts
    AFTER INSERT OR UPDATE OR DELETE ON faq_votes
    FOR EACH ROW EXECUTE FUNCTION update_faq_vote_counts();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_faq_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_trek_faqs_updated_at ON trek_faqs;
CREATE TRIGGER trigger_update_trek_faqs_updated_at
    BEFORE UPDATE ON trek_faqs
    FOR EACH ROW EXECUTE FUNCTION update_faq_updated_at();

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_faq_views(faq_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE trek_faqs SET views = views + 1 WHERE id = faq_uuid;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE trek_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Public can read approved FAQs
CREATE POLICY "Public can read approved trek faqs" ON trek_faqs
    FOR SELECT USING (is_approved = true);

-- Service role has full access
CREATE POLICY "Service role full access to trek faqs" ON trek_faqs
    FOR ALL USING (current_setting('role') = 'postgres');

-- Public can read all votes (for vote counts)
CREATE POLICY "Public can read faq votes" ON faq_votes
    FOR SELECT USING (true);

-- Service role has full access to votes
CREATE POLICY "Service role full access to faq votes" ON faq_votes
    FOR ALL USING (current_setting('role') = 'postgres');

-- Create view for FAQ statistics
CREATE OR REPLACE VIEW trek_faq_stats AS
SELECT 
    t.id as trek_id,
    t.slug as trek_slug,
    COUNT(tf.id) as total_questions,
    COUNT(CASE WHEN tf.is_answered = true THEN 1 END) as answered_questions,
    COUNT(CASE WHEN tf.is_approved = true THEN 1 END) as approved_questions,
    COUNT(CASE WHEN tf.is_featured = true THEN 1 END) as featured_questions,
    COALESCE(AVG(tf.upvotes), 0) as avg_upvotes,
    COALESCE(SUM(tf.views), 0) as total_views,
    MAX(tf.created_at) as latest_question_date
FROM treks t
LEFT JOIN trek_faqs tf ON t.id = tf.trek_id
GROUP BY t.id, t.slug;

-- Insert some sample FAQs for Adi Kailash & Om Parvat Trek
DO $$
DECLARE
    trek_uuid UUID;
    admin_uuid UUID;
BEGIN
    -- Get the trek ID for Adi Kailash & Om Parvat Trek
    SELECT id INTO trek_uuid FROM treks WHERE slug = 'adi-kailash-om-parvat-trek' LIMIT 1;
    
    -- Get an admin user ID (or create a system user)
    SELECT id INTO admin_uuid FROM auth_user WHERE email LIKE '%admin%' LIMIT 1;
    
    IF trek_uuid IS NOT NULL THEN
        -- Insert sample FAQs
        INSERT INTO trek_faqs (trek_id, user_id, question, answer, is_answered, is_approved, is_featured, answered_by, answered_at, category) VALUES
        (trek_uuid, COALESCE(admin_uuid, gen_random_uuid()), 
         'What is the best time to visit Adi Kailash and Om Parvat?', 
         'The best time to visit Adi Kailash and Om Parvat is from May to October, with June to September being the most favorable months. During this period, the weather is relatively stable, and the roads are accessible. Avoid monsoon season (July-August) due to heavy rainfall and potential landslides.',
         true, true, true, admin_uuid, NOW(), 'timing'),
        
        (trek_uuid, COALESCE(admin_uuid, gen_random_uuid()), 
         'What permits are required for this trek?', 
         'You need an Inner Line Permit (ILP) to visit Adi Kailash and Om Parvat as they are located near the Indo-China border. We assist in obtaining all necessary permits as part of our service. You''ll need to provide passport-sized photos, ID proof, and other documents in advance.',
         true, true, true, admin_uuid, NOW(), 'permits'),
        
        (trek_uuid, COALESCE(admin_uuid, gen_random_uuid()), 
         'What is the difficulty level of this trek?', 
         'This trek is rated as Moderate to Difficult. It involves high altitude (up to 6,191m for Om Parvat view), long driving hours on rough terrain, and basic accommodation facilities. Good physical fitness and prior high-altitude experience are recommended.',
         true, true, true, admin_uuid, NOW(), 'difficulty'),
        
        (trek_uuid, COALESCE(admin_uuid, gen_random_uuid()), 
         'What accommodation can we expect during the trek?', 
         'Accommodation varies from guesthouses and dharamshalas to camping. In remote areas, facilities are basic with shared bathrooms and limited hot water. We provide sleeping bags and camping equipment where needed. Expect simple but clean accommodation throughout the journey.',
         true, true, true, admin_uuid, NOW(), 'accommodation'),
        
        (trek_uuid, COALESCE(admin_uuid, gen_random_uuid()), 
         'Is this trek suitable for beginners?', 
         'This trek is not recommended for complete beginners due to high altitude, challenging terrain, and remote location. We recommend having prior trekking experience, especially at high altitudes. However, with proper preparation and fitness, motivated beginners can attempt this trek.',
         true, true, false, admin_uuid, NOW(), 'difficulty'),
        
        (trek_uuid, COALESCE(admin_uuid, gen_random_uuid()), 
         'What should I pack for this trek?', 
         'Essential items include warm clothing (temperatures can drop below freezing), sturdy trekking boots, rain gear, sunglasses, sunscreen, personal medications, and a good sleeping bag. We provide a detailed packing list upon booking. Pack light but ensure you have all essentials for high-altitude conditions.',
         true, true, false, admin_uuid, NOW(), 'packing');
    END IF;
END $$;
