const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to generate Unsplash card image URL based on trek characteristics
function generateCardImageUrl(trekName, region, difficulty) {
  const baseUrl = 'https://images.unsplash.com';
  
  // Generate keywords for the main card image
  const getCardKeywords = (name, region, difficulty) => {
    const keywords = [];
    
    // Region-based keywords (prioritize for card images)
    if (region?.toLowerCase().includes('nepal')) {
      keywords.push('himalaya', 'nepal', 'mountain');
    } else if (region?.toLowerCase().includes('uttarakhand')) {
      keywords.push('uttarakhand', 'himalaya', 'mountain');
    } else if (region?.toLowerCase().includes('himachal')) {
      keywords.push('himachal', 'mountain', 'snow');
    } else if (region?.toLowerCase().includes('ladakh')) {
      keywords.push('ladakh', 'mountain', 'desert');
    } else if (region?.toLowerCase().includes('kashmir')) {
      keywords.push('kashmir', 'mountain', 'lake');
    } else {
      keywords.push('mountain', 'hiking', 'landscape');
    }
    
    // Trek-specific keywords for card
    const nameLower = name.toLowerCase();
    if (nameLower.includes('lake')) keywords.push('lake');
    if (nameLower.includes('glacier')) keywords.push('glacier');
    if (nameLower.includes('peak') || nameLower.includes('summit')) keywords.push('peak');
    if (nameLower.includes('pass')) keywords.push('pass');
    if (nameLower.includes('valley')) keywords.push('valley');
    if (nameLower.includes('meadow') || nameLower.includes('bugyal')) keywords.push('meadow');
    if (nameLower.includes('base camp')) keywords.push('basecamp');
    
    return keywords.slice(0, 3); // Limit to 3 keywords for cleaner URLs
  };
  
  const keywords = getCardKeywords(trekName, region, difficulty);
  const keywordString = keywords.join(',');
  
  // Generate card image URL (16:9 aspect ratio for cards)
  return `${baseUrl}/1200x675/?${keywordString}`;
}

// Function to update trek card image
async function updateTrekCardImage(trek) {
  try {
    console.log(`🖼️  Updating card image for: ${trek.name}`);
    
    // Check if trek already has a custom image (not placeholder)
    if (trek.image && !trek.image.includes('placeholder') && trek.image.includes('unsplash')) {
      console.log(`⏭️  ${trek.name} already has an Unsplash image, skipping...`);
      return true;
    }
    
    // Generate new card image URL
    const cardImageUrl = generateCardImageUrl(trek.name, trek.region, trek.difficulty);
    
    // Update the trek's image column
    const { data: updatedTrek, error: updateError } = await supabase
      .from('treks')
      .update({ 
        image: cardImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', trek.id)
      .select();
    
    if (updateError) {
      console.error(`❌ Error updating card image for ${trek.name}:`, updateError);
      return false;
    }
    
    console.log(`✅ Updated card image for ${trek.name}`);
    console.log(`   🔗 ${cardImageUrl}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Unexpected error for ${trek.name}:`, error);
    return false;
  }
}

// Main function
async function addCardImagesForAllTreks() {
  try {
    console.log('🚀 Starting to add card images for all treks...\n');
    
    // Get all treks from database
    const { data: treks, error: treksError } = await supabase
      .from('treks')
      .select('id, name, slug, region, difficulty, image')
      .eq('status', true)
      .order('name');
    
    if (treksError) {
      console.error('❌ Error fetching treks:', treksError);
      return;
    }
    
    if (!treks || treks.length === 0) {
      console.log('⚠️  No treks found in database');
      return;
    }
    
    console.log(`📊 Found ${treks.length} treks in database\n`);
    
    let successCount = 0;
    let skippedCount = 0;
    let failureCount = 0;
    
    // Process each trek
    for (const trek of treks) {
      // Check if already has Unsplash image
      if (trek.image && trek.image.includes('unsplash')) {
        console.log(`⏭️  ${trek.name} already has Unsplash card image, skipping...`);
        skippedCount++;
        continue;
      }
      
      const success = await updateTrekCardImage(trek);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log('\n🎉 Card image update completed!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Successfully updated: ${successCount} treks`);
    console.log(`   ⏭️  Skipped (already had images): ${skippedCount} treks`);
    console.log(`   ❌ Failed: ${failureCount} treks`);
    console.log(`   📸 Total treks with card images: ${successCount + skippedCount}/${treks.length}`);
    
    if (successCount > 0) {
      console.log('\n🌐 Card images are now updated in the database!');
      console.log('🔗 These images will appear on trek cards throughout the website.');
      console.log('📱 Card images are optimized for 16:9 aspect ratio (1200x675px).');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Function to verify card images
async function verifyCardImages() {
  try {
    console.log('\n🔍 Verifying card images...\n');
    
    const { data: treks, error } = await supabase
      .from('treks')
      .select('name, image')
      .eq('status', true)
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching treks:', error);
      return;
    }
    
    const withImages = treks.filter(t => t.image && !t.image.includes('placeholder'));
    const withUnsplash = treks.filter(t => t.image && t.image.includes('unsplash'));
    const withoutImages = treks.filter(t => !t.image || t.image.includes('placeholder'));
    
    console.log(`📊 Card Image Summary:`);
    console.log(`   🏔️  Total treks: ${treks.length}`);
    console.log(`   ✅ With card images: ${withImages.length}`);
    console.log(`   🔗 With Unsplash images: ${withUnsplash.length}`);
    console.log(`   ❌ Without images: ${withoutImages.length}`);
    
    if (withoutImages.length > 0) {
      console.log(`\n⚠️  Treks without card images:`);
      withoutImages.forEach(trek => {
        console.log(`   - ${trek.name}`);
      });
    }
    
    console.log(`\n📸 Sample card images:`);
    const samples = withUnsplash.slice(0, 5);
    samples.forEach(trek => {
      console.log(`   🏔️  ${trek.name}`);
      console.log(`      🔗 ${trek.image}`);
    });
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Run the script
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--verify')) {
    verifyCardImages()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('\n💥 Verification failed:', error);
        process.exit(1);
      });
  } else {
    addCardImagesForAllTreks()
      .then(() => verifyCardImages())
      .then(() => {
        console.log('\n✨ Script completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { addCardImagesForAllTreks, generateCardImageUrl, verifyCardImages };
