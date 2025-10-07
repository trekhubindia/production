-- Create trek_leaders table for homepage trek leaders section
CREATE TABLE IF NOT EXISTS trek_leaders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    experience_years INTEGER DEFAULT 0,
    photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample trek leaders data
INSERT INTO trek_leaders (name, bio, experience_years, photo) VALUES
('Rajesh Kumar', 'Certified mountaineer with extensive experience in Himalayan treks. Specializes in high-altitude expeditions and has successfully led over 200 treks across Uttarakhand and Himachal Pradesh.', 12, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'),
('Priya Sharma', 'Expert trek leader and wilderness survival instructor. Known for her expertise in flora and fauna of the Himalayas and commitment to sustainable trekking practices.', 8, 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face'),
('Amit Singh', 'Professional guide with deep knowledge of Ladakh and Kashmir regions. Former army personnel with exceptional navigation skills and emergency response training.', 15, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'),
('Sunita Devi', 'Local guide from Uttarakhand with intimate knowledge of traditional routes and cultural heritage. Passionate about sharing the spiritual aspects of Himalayan trekking.', 10, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face'),
('Vikram Thapa', 'Experienced mountaineer and rescue specialist. Has climbed several peaks above 6000m and holds certifications in wilderness first aid and high-altitude medicine.', 14, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face'),
('Meera Joshi', 'Adventure photographer and trek leader who combines her passion for mountains with storytelling. Specializes in photography workshops during treks.', 6, 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face')
ON CONFLICT (id) DO NOTHING;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_trek_leaders_experience ON trek_leaders(experience_years DESC);
CREATE INDEX IF NOT EXISTS idx_trek_leaders_created_at ON trek_leaders(created_at DESC);
