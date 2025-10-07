const fs = require('fs');
const path = require('path');

async function setupGoogleAnalytics() {
  console.log('🔧 Setting up Google Analytics integration...\n');

  // Read the service account JSON file
  const serviceAccountPath = path.join(process.cwd(), 'sharp-arcanum-387917-d47f678fbf5e.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Service account JSON file not found at:', serviceAccountPath);
    console.log('📝 Please ensure the file exists in the project root');
    return;
  }

  try {
    const serviceAccountData = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    console.log('✅ Service account file loaded successfully');
    console.log('📊 Project ID:', serviceAccountData.project_id);
    console.log('📧 Client Email:', serviceAccountData.client_email);
    
    // Check if .env.local exists
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      console.log('✅ Found existing .env.local file');
    } else {
      console.log('📝 Creating new .env.local file');
    }

    // Prepare the service account key as a single line JSON string
    const serviceAccountKey = JSON.stringify(serviceAccountData);
    
    // Add or update Google Analytics configuration
    const googleAnalyticsConfig = `
# Google Analytics Configuration
GOOGLE_ANALYTICS_PROPERTY_ID=your-ga4-property-id-here
GOOGLE_SERVICE_ACCOUNT_KEY='${serviceAccountKey}'
`;

    // Check if Google Analytics config already exists
    if (envContent.includes('GOOGLE_ANALYTICS_PROPERTY_ID')) {
      console.log('⚠️  Google Analytics configuration already exists in .env.local');
      console.log('📝 Please update manually if needed');
    } else {
      // Append to .env.local
      fs.writeFileSync(envPath, envContent + googleAnalyticsConfig);
      console.log('✅ Added Google Analytics configuration to .env.local');
    }

    console.log('\n📋 Next Steps:');
    console.log('1. 🔗 Set up Google Analytics 4 property if not already done');
    console.log('2. 📊 Get your GA4 Property ID from Google Analytics dashboard');
    console.log('3. ✏️  Update GOOGLE_ANALYTICS_PROPERTY_ID in .env.local');
    console.log('4. 🔐 Add the service account email to your GA4 property as a viewer');
    console.log('   Service Account Email:', serviceAccountData.client_email);
    console.log('5. 🚀 Restart your development server');

    console.log('\n🎯 Google Analytics Setup Instructions:');
    console.log('1. Go to https://analytics.google.com/');
    console.log('2. Select your property or create a new GA4 property');
    console.log('3. Go to Admin > Property Settings');
    console.log('4. Copy the Property ID (format: 123456789)');
    console.log('5. Go to Admin > Property Access Management');
    console.log('6. Click "+" and add the service account email as Viewer');
    console.log('7. Update GOOGLE_ANALYTICS_PROPERTY_ID in .env.local');

    console.log('\n💡 Testing:');
    console.log('- Visit /admin/analytics to see Google Analytics data');
    console.log('- The system will show mock data if GA is not properly configured');
    console.log('- Check browser console for any authentication errors');

  } catch (error) {
    console.error('❌ Error setting up Google Analytics:', error.message);
  }
}

// Run the setup
setupGoogleAnalytics();
