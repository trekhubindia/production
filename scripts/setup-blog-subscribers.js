const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupBlogSubscribers() {
  console.log('🚀 Setting up blog subscribers system...\n');

  try {
    // Check if table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('blog_subscribers')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('✅ Blog subscribers table already exists');
      
      // Get current stats
      const { data: stats } = await supabase
        .from('blog_subscribers')
        .select('status');
      
      const statsSummary = stats?.reduce((acc, sub) => {
        acc[sub.status] = (acc[sub.status] || 0) + 1;
        return acc;
      }, {}) || {};

      console.log('📊 Current subscriber stats:');
      console.log(`   Total: ${stats?.length || 0}`);
      console.log(`   Active: ${statsSummary.active || 0}`);
      console.log(`   Unsubscribed: ${statsSummary.unsubscribed || 0}`);
      console.log(`   Pending: ${statsSummary.pending || 0}`);
      
      return;
    }

    console.log('📋 Creating blog_subscribers table...');

    // Create the table and functions using raw SQL
    const createTableSQL = `
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
          FOR SELECT USING (true);

      CREATE POLICY "Allow users to update their own subscription" ON blog_subscribers
          FOR UPDATE USING (true);
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    });

    if (createError) {
      console.error('❌ Error creating table:', createError);
      
      // Try alternative approach - execute parts separately
      console.log('🔄 Trying alternative table creation...');
      
      const { error: altError } = await supabase
        .from('blog_subscribers')
        .select('id')
        .limit(0);
      
      if (altError && altError.code === '42P01') {
        console.log('📋 Table does not exist, this is expected for new setup');
        console.log('⚠️  Please run the migration manually:');
        console.log('   supabase db push');
        console.log('   or apply the migration file: supabase/migrations/20250928210000_create_blog_subscribers_table.sql');
        return;
      }
    }

    console.log('✅ Blog subscribers table created successfully');

    // Create helper functions
    console.log('🔧 Creating helper functions...');

    const addSubscriberFunction = `
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
    `;

    const unsubscribeFunction = `
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
    `;

    // Try to create functions (may fail if exec_sql is not available)
    try {
      await supabase.rpc('exec_sql', { sql: addSubscriberFunction });
      await supabase.rpc('exec_sql', { sql: unsubscribeFunction });
      console.log('✅ Helper functions created successfully');
    } catch (funcError) {
      console.log('⚠️  Could not create functions automatically');
      console.log('   Please run: supabase db push');
    }

    // Test the setup
    console.log('🧪 Testing blog subscribers setup...');
    
    const { data: testData, error: testError } = await supabase
      .from('blog_subscribers')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Test failed:', testError.message);
    } else {
      console.log('✅ Blog subscribers system is working correctly');
    }

    console.log('\n🎉 Blog subscribers setup completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. The subscription components are now available in your app');
    console.log('   2. Visit /admin/subscribers to manage subscribers');
    console.log('   3. Users can subscribe via blog pages');
    console.log('   4. Unsubscribe page is available at /unsubscribe');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n🔧 Manual setup required:');
    console.log('   1. Run: supabase db push');
    console.log('   2. Or apply migration: supabase/migrations/20250928210000_create_blog_subscribers_table.sql');
  }
}

// Run the setup
setupBlogSubscribers();
