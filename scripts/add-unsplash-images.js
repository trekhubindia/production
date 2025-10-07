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

// Function to generate Unsplash URLs based on trek themes
function generateUnsplashImages(trekName, region, difficulty) {
  const baseUrl = 'https://images.unsplash.com';
  
  // Keywords based on trek characteristics
  const getKeywords = (name, region, difficulty) => {
    const keywords = [];
    
    // Region-based keywords
    if (region?.toLowerCase().includes('nepal')) {
      keywords.push('himalaya', 'everest', 'annapurna', 'nepal mountains');
    } else if (region?.toLowerCase().includes('uttarakhand')) {
      keywords.push('uttarakhand mountains', 'garhwal himalaya', 'kumaon');
    } else if (region?.toLowerCase().includes('himachal')) {
      keywords.push('himachal pradesh', 'manali', 'dharamshala');
    } else if (region?.toLowerCase().includes('ladakh')) {
      keywords.push('ladakh', 'leh', 'desert mountains');
    } else if (region?.toLowerCase().includes('kashmir')) {
      keywords.push('kashmir', 'dal lake', 'srinagar');
    }
    
    // Trek-specific keywords
    const nameLower = name.toLowerCase();
    if (nameLower.includes('lake')) keywords.push('mountain lake', 'alpine lake');
    if (nameLower.includes('glacier')) keywords.push('glacier', 'ice');
    if (nameLower.includes('peak') || nameLower.includes('summit')) keywords.push('mountain peak', 'summit');
    if (nameLower.includes('pass')) keywords.push('mountain pass', 'high altitude');
    if (nameLower.includes('valley')) keywords.push('mountain valley', 'green valley');
    if (nameLower.includes('meadow') || nameLower.includes('bugyal')) keywords.push('alpine meadow', 'grassland');
    if (nameLower.includes('base camp')) keywords.push('base camp', 'expedition');
    if (nameLower.includes('circuit')) keywords.push('trekking trail', 'mountain circuit');
    
    // Difficulty-based keywords
    if (difficulty?.toLowerCase().includes('easy')) {
      keywords.push('gentle slopes', 'forest trail');
    } else if (difficulty?.toLowerCase().includes('difficult') || difficulty?.toLowerCase().includes('expert')) {
      keywords.push('steep mountains', 'rocky terrain', 'challenging climb');
    }
    
    // Default mountain keywords
    if (keywords.length === 0) {
      keywords.push('mountain trekking', 'hiking trail', 'mountain landscape');
    }
    
    return keywords;
  };
  
  const keywords = getKeywords(trekName, region, difficulty);
  
  // Generate multiple images with different themes
  const images = [
    {
      url: `${baseUrl}/1600x900/?${keywords[0]?.replace(/\s+/g, ',')}`,
      alt: `${trekName} - Mountain landscape view`,
      caption: `Stunning mountain views during ${trekName}`,
      is_featured: true,
      sort_order: 1
    },
    {
      url: `${baseUrl}/1600x900/?${keywords[1] || 'mountain,hiking'}`.replace(/\s+/g, ','),
      alt: `${trekName} - Trekking trail`,
      caption: `Beautiful trekking trails on ${trekName}`,
      is_featured: false,
      sort_order: 2
    },
    {
      url: `${baseUrl}/1600x900/?${keywords[2] || 'nature,adventure'}`.replace(/\s+/g, ','),
      alt: `${trekName} - Adventure scene`,
      caption: `Adventure moments during ${trekName}`,
      is_featured: false,
      sort_order: 3
    }
  ];
  
  // Add region-specific image if available
  if (keywords.length > 3) {
    images.push({
      url: `${baseUrl}/1600x900/?${keywords[3]}`.replace(/\s+/g, ','),
      alt: `${trekName} - Regional landscape`,
      caption: `Regional beauty of ${region}`,
      is_featured: false,
      sort_order: 4
    });
  }
  
  return images;
}

// Function to add images for a trek
async function addImagesForTrek(trek) {
  try {
    console.log(`📸 Adding images for: ${trek.name}`);
    
    // Check if trek already has images
    const { data: existingImages, error: checkError } = await supabase
      .from('trek_images')
      .select('id')
      .eq('trek_id', trek.id);
    
    if (checkError) {
      console.error(`❌ Error checking existing images for ${trek.name}:`, checkError);
      return false;
    }
    
    if (existingImages && existingImages.length > 0) {
      console.log(`⏭️  ${trek.name} already has ${existingImages.length} images, skipping...`);
      return true;
    }
    
    // Generate Unsplash images
    const images = generateUnsplashImages(trek.name, trek.region, trek.difficulty);
    
    // Prepare images for database insertion
    const imagesToInsert = images.map(img => ({
      trek_id: trek.id,
      image_url: img.url,
      alt_text: img.alt,
      caption: img.caption,
      is_featured: img.is_featured,
      sort_order: img.sort_order
    }));
    
    // Insert images into database
    const { data: insertedImages, error: insertError } = await supabase
      .from('trek_images')
      .insert(imagesToInsert)
      .select();
    
    if (insertError) {
      console.error(`❌ Error inserting images for ${trek.name}:`, insertError);
      return false;
    }
    
    console.log(`✅ Added ${insertedImages.length} images for ${trek.name}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Unexpected error for ${trek.name}:`, error);
    return false;
  }
}

// Main function
async function addUnsplashImagesForAllTreks() {
  try {
    console.log('🚀 Starting to add Unsplash images for all treks...\n');
    
    // Get all treks from database
    const { data: treks, error: treksError } = await supabase
      .from('treks')
      .select('id, name, slug, region, difficulty')
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
    let failureCount = 0;
    
    // Process each trek
    for (const trek of treks) {
      const success = await addImagesForTrek(trek);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Small delay to avoid overwhelming Unsplash
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 Image addition completed!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Successfully processed: ${successCount} treks`);
    console.log(`   ❌ Failed: ${failureCount} treks`);
    console.log(`   📸 Total images added: ${successCount * 3} (approximately)`);
    
    if (successCount > 0) {
      console.log('\n🌐 Images are now available in the database and should appear on the website!');
      console.log('🔗 Unsplash images are dynamically generated and cached for optimal performance.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the script
if (require.main === module) {
  addUnsplashImagesForAllTreks()
    .then(() => {
      console.log('\n✨ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addUnsplashImagesForAllTreks, generateUnsplashImages };
