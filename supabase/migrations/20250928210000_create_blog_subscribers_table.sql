-- Create blog_subscribers table for newsletter subscriptions
CREATE TABLE IF NOT EXISTS blog_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'pending')),
    subscription_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_date TIMESTAMP WITH TIME ZONE,
    verification_token VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_email ON blog_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_status ON blog_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_verified ON blog_subscribers(verified);
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_subscription_date ON blog_subscribers(subscription_date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_blog_subscribers_updated_at 
    BEFORE UPDATE ON blog_subscribers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security)
ALTER TABLE blog_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public to subscribe" ON blog_subscribers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to view their own subscription" ON blog_subscribers
    FOR SELECT USING (true); -- For now, allow reading for admin purposes

CREATE POLICY "Allow users to update their own subscription" ON blog_subscribers
    FOR UPDATE USING (true); -- For now, allow updates for admin purposes

-- Create a function to safely add subscribers
CREATE OR REPLACE FUNCTION add_blog_subscriber(
    subscriber_email VARCHAR(255),
    subscriber_name VARCHAR(255) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    subscriber_id UUID;
BEGIN
    -- Check if email already exists
    SELECT id INTO subscriber_id 
    FROM blog_subscribers 
    WHERE email = subscriber_email;
    
    IF subscriber_id IS NOT NULL THEN
        -- Update existing subscriber if they were unsubscribed
        UPDATE blog_subscribers 
        SET 
            status = 'active',
            name = COALESCE(subscriber_name, name),
            subscription_date = NOW(),
            unsubscribed_date = NULL,
            updated_at = NOW()
        WHERE id = subscriber_id AND status = 'unsubscribed';
        
        result = jsonb_build_object(
            'success', true,
            'message', 'Subscription updated successfully',
            'subscriber_id', subscriber_id,
            'action', 'updated'
        );
    ELSE
        -- Insert new subscriber
        INSERT INTO blog_subscribers (email, name, status, verified)
        VALUES (subscriber_email, subscriber_name, 'active', true)
        RETURNING id INTO subscriber_id;
        
        result = jsonb_build_object(
            'success', true,
            'message', 'Subscription created successfully',
            'subscriber_id', subscriber_id,
            'action', 'created'
        );
    END IF;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Failed to process subscription: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to unsubscribe
CREATE OR REPLACE FUNCTION unsubscribe_blog_subscriber(
    subscriber_email VARCHAR(255)
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    subscriber_id UUID;
BEGIN
    -- Find and update subscriber
    UPDATE blog_subscribers 
    SET 
        status = 'unsubscribed',
        unsubscribed_date = NOW(),
        updated_at = NOW()
    WHERE email = subscriber_email AND status = 'active'
    RETURNING id INTO subscriber_id;
    
    IF subscriber_id IS NOT NULL THEN
        result = jsonb_build_object(
            'success', true,
            'message', 'Successfully unsubscribed',
            'subscriber_id', subscriber_id
        );
    ELSE
        result = jsonb_build_object(
            'success', false,
            'message', 'Email not found or already unsubscribed'
        );
    END IF;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Failed to unsubscribe: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
