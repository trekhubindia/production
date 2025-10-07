-- Create trek_faqs table for user questions and admin answers
CREATE TABLE IF NOT EXISTS trek_faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trek_id UUID REFERENCES treks(id) ON DELETE CASCADE,
  trek_slug TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  user_id UUID REFERENCES auth_user(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'hidden')),
  is_featured BOOLEAN DEFAULT false,
  admin_id UUID REFERENCES auth_user(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answered_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trek_faqs_trek_slug ON trek_faqs (trek_slug);
CREATE INDEX IF NOT EXISTS idx_trek_faqs_status ON trek_faqs (status);
CREATE INDEX IF NOT EXISTS idx_trek_faqs_featured ON trek_faqs (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_trek_faqs_created_at ON trek_faqs (created_at DESC);

-- Add RLS policies
ALTER TABLE trek_faqs ENABLE ROW LEVEL SECURITY;

-- Policy for service role (API access)
CREATE POLICY "Service role can manage all trek_faqs" ON trek_faqs
  FOR ALL USING (current_setting('role') = 'postgres');

-- Policy for public read access to answered FAQs
CREATE POLICY "Public can read answered trek_faqs" ON trek_faqs
  FOR SELECT USING (status = 'answered');

-- Insert sample FAQs for testing
INSERT INTO trek_faqs (trek_slug, question, answer, user_name, status, is_featured, answered_at)
VALUES 
(
  'adi-kailash-om-parvat-trek',
  'What is the best time to do this trek?',
  'The best time for Adi Kailash & Om Parvat Trek is from May to October when the weather is favorable and the routes are accessible.',
  'Sample User',
  'answered',
  true,
  NOW()
),
(
  'adi-kailash-om-parvat-trek',
  'What is the difficulty level of this trek?',
  'This is a moderate to difficult trek suitable for experienced trekkers with good physical fitness. Prior high-altitude trekking experience is recommended.',
  'Trek Enthusiast',
  'answered',
  false,
  NOW()
),
(
  'kedarkantha-trek',
  'Is this trek suitable for beginners?',
  'Yes, Kedarkantha is considered one of the best beginner-friendly winter treks. It offers a perfect introduction to high-altitude trekking.',
  'Beginner Trekker',
  'answered',
  true,
  NOW()
);
