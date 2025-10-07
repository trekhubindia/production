const fs = require('fs');
const path = require('path');

// Comprehensive coordinate mapping for trek locations
const locationCoordinates = {
  // Uttarakhand locations
  'Pithoragarh': { lat: 29.5833, lng: 80.2167 },
  'Dharchula': { lat: 29.8500, lng: 80.5500 },
  'Gunji': { lat: 30.2167, lng: 80.4833 },
  'Kalapani': { lat: 30.2500, lng: 80.4667 },
  'Navidhang': { lat: 30.3000, lng: 80.4500 },
  'Adi Kailash Base': { lat: 30.3500, lng: 80.4000 },
  'Adi Kailash': { lat: 30.3667, lng: 80.3833 },
  'Om Parvat Base': { lat: 30.3833, lng: 80.3500 },
  'Om Parvat': { lat: 30.4000, lng: 80.3333 },
  
  // Garhwal region
  'Dehradun': { lat: 30.3165, lng: 78.0322 },
  'Rishikesh': { lat: 30.0869, lng: 78.2676 },
  'Haridwar': { lat: 29.9457, lng: 78.1642 },
  'Joshimath': { lat: 30.5564, lng: 79.5644 },
  'Govindghat': { lat: 30.6333, lng: 79.5833 },
  'Ghangaria': { lat: 30.7167, lng: 79.6000 },
  'Valley of Flowers': { lat: 30.7333, lng: 79.6167 },
  'Hemkund Sahib': { lat: 30.7167, lng: 79.6333 },
  'Badrinath': { lat: 30.7433, lng: 79.4938 },
  'Mana Village': { lat: 30.7667, lng: 79.4833 },
  'Vasudhara Falls': { lat: 30.7833, lng: 79.4667 },
  
  // Kedarnath region
  'Kedarnath': { lat: 30.7346, lng: 79.0669 },
  'Gaurikund': { lat: 30.6167, lng: 79.0833 },
  'Rambara': { lat: 30.6833, lng: 79.0667 },
  'Lincholi': { lat: 30.7000, lng: 79.0500 },
  
  // Gangotri region
  'Gangotri': { lat: 30.9929, lng: 78.9408 },
  'Gaumukh': { lat: 30.9167, lng: 79.0833 },
  'Tapovan': { lat: 30.8833, lng: 79.1000 },
  'Nandanvan': { lat: 30.8667, lng: 79.1167 },
  'Bhojbasa': { lat: 30.9000, lng: 79.0667 },
  
  // Yamunotri region
  'Yamunotri': { lat: 31.0167, lng: 78.4500 },
  'Janki Chatti': { lat: 31.0000, lng: 78.4667 },
  'Hanuman Chatti': { lat: 30.9833, lng: 78.4833 },
  
  // Har Ki Dun region
  'Sankri': { lat: 31.2167, lng: 78.2333 },
  'Taluka': { lat: 31.2333, lng: 78.2167 },
  'Osla': { lat: 31.2500, lng: 78.2000 },
  'Har Ki Dun': { lat: 31.2667, lng: 78.1833 },
  'Jaundhar Glacier': { lat: 31.2833, lng: 78.1667 },
  
  // Rupin Pass region
  'Dhaula': { lat: 31.2000, lng: 78.2500 },
  'Jiskun': { lat: 31.2167, lng: 78.2333 },
  'Jhaka': { lat: 31.2333, lng: 78.2167 },
  'Saruwas Thach': { lat: 31.2500, lng: 78.2000 },
  'Rupin Pass': { lat: 31.2667, lng: 78.1833 },
  'Ronti Gad': { lat: 31.2833, lng: 78.1667 },
  'Sangla': { lat: 31.4167, lng: 78.2667 },
  
  // Chopta region
  'Chopta': { lat: 30.5333, lng: 79.0333 },
  'Tungnath': { lat: 30.5167, lng: 79.0500 },
  'Chandrashila': { lat: 30.5000, lng: 79.0667 },
  'Deoriatal': { lat: 30.5500, lng: 79.0167 },
  'Ukhimath': { lat: 30.5167, lng: 79.1833 },
  'Sari Village': { lat: 30.5667, lng: 79.0000 },
  
  // Brahmatal region
  'Lohajung': { lat: 30.1833, lng: 79.5833 },
  'Bekaltal': { lat: 30.2000, lng: 79.5667 },
  'Brahmatal': { lat: 30.2167, lng: 79.5500 },
  'Tilandi': { lat: 30.2333, lng: 79.5333 },
  
  // Roopkund region
  'Wan Village': { lat: 30.2167, lng: 79.6167 },
  'Didna Village': { lat: 30.2333, lng: 79.6000 },
  'Ali Bugyal': { lat: 30.2500, lng: 79.5833 },
  'Bedni Bugyal': { lat: 30.2667, lng: 79.5667 },
  'Roopkund': { lat: 30.2833, lng: 79.5500 },
  'Junargali': { lat: 30.3000, lng: 79.5333 },
  
  // Kuari Pass region
  'Dhak Village': { lat: 30.4833, lng: 79.4833 },
  'Gulling': { lat: 30.5000, lng: 79.4667 },
  'Khullara': { lat: 30.5167, lng: 79.4500 },
  'Tali Top': { lat: 30.5333, lng: 79.4333 },
  'Kuari Pass': { lat: 30.5500, lng: 79.4167 },
  
  // Himachal Pradesh locations
  'Manali': { lat: 32.2396, lng: 77.1887 },
  'Solang Valley': { lat: 32.3167, lng: 77.1500 },
  'Beas Kund': { lat: 32.3500, lng: 77.1333 },
  'Dhundi': { lat: 32.3333, lng: 77.1167 },
  'Bakarthach': { lat: 32.3667, lng: 77.1000 },
  
  // Bhrigu Lake region
  'Gulaba': { lat: 32.3167, lng: 77.1833 },
  'Roli Kholi': { lat: 32.3333, lng: 77.1667 },
  'Bhrigu Lake': { lat: 32.3500, lng: 77.1500 },
  
  // Hampta Pass region
  'Jobra': { lat: 32.2833, lng: 77.1833 },
  'Chika': { lat: 32.3000, lng: 77.1667 },
  'Balu ka Gera': { lat: 32.3167, lng: 77.1500 },
  'Hampta Pass': { lat: 32.3333, lng: 77.1333 },
  'Shea Goru': { lat: 32.3500, lng: 77.1167 },
  'Chatru': { lat: 32.3667, lng: 77.1000 },
  
  // Pin Parvati Pass region
  'Barsheni': { lat: 32.1833, lng: 77.3500 },
  'Kheerganga': { lat: 32.2000, lng: 77.3333 },
  'Tunda Bhuj': { lat: 32.2167, lng: 77.3167 },
  'Thakur Kuan': { lat: 32.2333, lng: 77.3000 },
  'Odi Thach': { lat: 32.2500, lng: 77.2833 },
  'Pin Parvati Pass': { lat: 32.2667, lng: 77.2667 },
  'Mud': { lat: 32.2833, lng: 77.2500 },
  'Mikkim': { lat: 32.3000, lng: 77.2333 },
  
  // Spiti Valley
  'Kaza': { lat: 32.2236, lng: 78.0719 },
  'Kibber': { lat: 32.2833, lng: 78.0333 },
  'Tashigang': { lat: 32.3000, lng: 78.0167 },
  'Langza': { lat: 32.2667, lng: 78.0500 },
  'Hikkim': { lat: 32.2500, lng: 78.0667 },
  'Komic': { lat: 32.2333, lng: 78.0833 },
  
  // Ladakh locations
  'Leh': { lat: 34.1526, lng: 77.5771 },
  'Chilling': { lat: 34.0833, lng: 77.4167 },
  'Tilat Sumdo': { lat: 34.0667, lng: 77.4333 },
  'Shingra Koma': { lat: 34.0500, lng: 77.4500 },
  'Lingshed': { lat: 34.0333, lng: 77.4667 },
  'Nyerak': { lat: 34.0167, lng: 77.4833 },
  
  // Markha Valley
  'Spituk': { lat: 34.1667, lng: 77.5333 },
  'Jingchen': { lat: 34.1500, lng: 77.5500 },
  'Rumbak': { lat: 34.1333, lng: 77.5667 },
  'Yurutse': { lat: 34.1167, lng: 77.5833 },
  'Shingo': { lat: 34.1000, lng: 77.6000 },
  'Skiu': { lat: 34.0833, lng: 77.6167 },
  'Markha': { lat: 34.0667, lng: 77.6333 },
  'Hankar': { lat: 34.0500, lng: 77.6500 },
  'Nimaling': { lat: 34.0333, lng: 77.6667 },
  'Kongmaru La': { lat: 34.0167, lng: 77.6833 },
  'Chokdo': { lat: 34.0000, lng: 77.7000 },
  'Hemis': { lat: 33.9833, lng: 77.7167 },
  
  // Chadar Trek
  'Tilat Sumdo': { lat: 34.0833, lng: 77.4167 },
  'Shingra Koma': { lat: 34.0667, lng: 77.4333 },
  'Tibb Cave': { lat: 34.0500, lng: 77.4500 },
  'Naerak': { lat: 34.0333, lng: 77.4667 },
  'Lingshed Gompa': { lat: 34.0167, lng: 77.4833 },
  
  // Nepal locations
  'Kathmandu': { lat: 27.7172, lng: 85.3240 },
  'Lukla': { lat: 27.6869, lng: 86.7314 },
  'Phakding': { lat: 27.7333, lng: 86.7167 },
  'Namche Bazaar': { lat: 27.8056, lng: 86.7139 },
  'Tengboche': { lat: 27.8361, lng: 86.7639 },
  'Dingboche': { lat: 27.8917, lng: 86.8306 },
  'Lobuche': { lat: 27.9500, lng: 86.8083 },
  'Gorak Shep': { lat: 27.9833, lng: 86.8278 },
  'Everest Base Camp': { lat: 28.0018, lng: 86.8528 },
  'Kala Patthar': { lat: 27.9958, lng: 86.8289 },
  
  // Annapurna region
  'Pokhara': { lat: 28.2096, lng: 83.9856 },
  'Nayapul': { lat: 28.3667, lng: 83.7833 },
  'Tikhedhunga': { lat: 28.3833, lng: 83.7667 },
  'Ghorepani': { lat: 28.4000, lng: 83.7500 },
  'Poon Hill': { lat: 28.4167, lng: 83.7333 },
  'Tadapani': { lat: 28.4333, lng: 83.7167 },
  'Chhomrong': { lat: 28.4500, lng: 83.7000 },
  'Bamboo': { lat: 28.4667, lng: 83.6833 },
  'Deurali': { lat: 28.4833, lng: 83.6667 },
  'Machapuchare Base Camp': { lat: 28.5000, lng: 83.6500 },
  'Annapurna Base Camp': { lat: 28.5167, lng: 83.6333 },
  
  // Langtang region
  'Syabrubesi': { lat: 28.1667, lng: 85.3833 },
  'Lama Hotel': { lat: 28.2000, lng: 85.3667 },
  'Langtang Village': { lat: 28.2333, lng: 85.3500 },
  'Kyanjin Gompa': { lat: 28.2667, lng: 85.3333 },
  'Tserko Ri': { lat: 28.3000, lng: 85.3167 },
  
  // Kashmir locations
  'Srinagar': { lat: 34.0837, lng: 74.7973 },
  'Pahalgam': { lat: 34.0167, lng: 75.3167 },
  'Aru Valley': { lat: 34.0333, lng: 75.3000 },
  'Lidderwat': { lat: 34.0500, lng: 75.2833 },
  'Sekiwas': { lat: 34.0667, lng: 75.2667 },
  'Kolahoi Glacier': { lat: 34.0833, lng: 75.2500 },
  
  // Sonamarg region
  'Sonamarg': { lat: 34.3167, lng: 75.3000 },
  'Nichinai': { lat: 34.3333, lng: 75.2833 },
  'Vishansar Lake': { lat: 34.3500, lng: 75.2667 },
  'Krishansar Lake': { lat: 34.3667, lng: 75.2500 },
  'Gadsar Lake': { lat: 34.3833, lng: 75.2333 },
  'Satsar Lakes': { lat: 34.4000, lng: 75.2167 },
  'Gangbal Lake': { lat: 34.4167, lng: 75.2000 },
  'Naranag': { lat: 34.4333, lng: 75.1833 },
  
  // Gulmarg region
  'Gulmarg': { lat: 34.0500, lng: 74.3833 },
  'Khilanmarg': { lat: 34.0667, lng: 74.3667 },
  'Alpather Lake': { lat: 34.0833, lng: 74.3500 },
  
  // Additional common trek points
  'Base Camp': { lat: 0, lng: 0 }, // Will be calculated based on context
  'Summit': { lat: 0, lng: 0 }, // Will be calculated based on context
  'Viewpoint': { lat: 0, lng: 0 }, // Will be calculated based on context
  'Rest Day': { lat: 0, lng: 0 }, // Same as previous day
  'Acclimatization': { lat: 0, lng: 0 }, // Same as previous day
};

// Function to find coordinates for a location
function findCoordinates(title, description, previousCoords = null) {
  const searchText = `${title} ${description}`.toLowerCase();
  
  // Direct location match
  for (const [location, coords] of Object.entries(locationCoordinates)) {
    if (searchText.includes(location.toLowerCase())) {
      return coords;
    }
  }
  
  // Special cases
  if (searchText.includes('rest day') || searchText.includes('acclimatization') || searchText.includes('acclimatize')) {
    return previousCoords || { lat: 0, lng: 0 };
  }
  
  if (searchText.includes('drive') || searchText.includes('arrival') || searchText.includes('departure')) {
    // Try to extract destination from description
    const words = searchText.split(' ');
    for (const word of words) {
      for (const [location, coords] of Object.entries(locationCoordinates)) {
        if (word.includes(location.toLowerCase())) {
          return coords;
        }
      }
    }
  }
  
  // Region-based approximation
  if (searchText.includes('uttarakhand') || searchText.includes('garhwal') || searchText.includes('kumaon')) {
    return { lat: 30.0668, lng: 79.0193 }; // Central Uttarakhand
  }
  if (searchText.includes('himachal') || searchText.includes('manali') || searchText.includes('kullu')) {
    return { lat: 32.2432, lng: 77.1892 }; // Central Himachal
  }
  if (searchText.includes('ladakh') || searchText.includes('leh')) {
    return { lat: 34.1526, lng: 77.5771 }; // Leh
  }
  if (searchText.includes('kashmir') || searchText.includes('srinagar')) {
    return { lat: 34.0837, lng: 74.7973 }; // Srinagar
  }
  if (searchText.includes('nepal') || searchText.includes('kathmandu')) {
    return { lat: 27.7172, lng: 85.3240 }; // Kathmandu
  }
  
  // Default coordinates (center of India)
  return { lat: 28.6139, lng: 77.2090 };
}

// Function to add coordinates to trek itinerary
function addCoordinatesToTrek(trek) {
  let itinerary = null;
  let isInSections = false;
  
  // Check if itinerary is in sections or directly in trek
  if (trek.sections && trek.sections.itinerary) {
    itinerary = trek.sections.itinerary;
    isInSections = true;
  } else if (trek.itinerary) {
    itinerary = trek.itinerary;
    isInSections = false;
  }
  
  if (!itinerary) {
    return trek;
  }
  
  let previousCoords = null;
  
  const updatedItinerary = itinerary.map((day, index) => {
    // Skip if coordinates already exist
    if (day.coordinates) {
      previousCoords = day.coordinates;
      return day;
    }
    
    const coords = findCoordinates(day.title, day.description, previousCoords);
    previousCoords = coords;
    
    return {
      ...day,
      coordinates: {
        lat: coords.lat,
        lng: coords.lng
      }
    };
  });
  
  // Update the appropriate location
  if (isInSections) {
    trek.sections.itinerary = updatedItinerary;
  } else {
    trek.itinerary = updatedItinerary;
  }
  
  return trek;
}

// Main function to process all treks
function addGeoCoordinates() {
  try {
    console.log('🗺️  Adding geographical coordinates to trek itineraries...');
    
    // Read the treks JSON file
    const treksPath = path.join(__dirname, '..', 'data', 'treks.json');
    const treksData = JSON.parse(fs.readFileSync(treksPath, 'utf8'));
    
    console.log(`📊 Processing ${treksData.treks.length} treks...`);
    
    // Process each trek
    let updatedCount = 0;
    treksData.treks = treksData.treks.map((trek, index) => {
      console.log(`Processing ${index + 1}/${treksData.treks.length}: ${trek.name}`);
      
      const updatedTrek = addCoordinatesToTrek(trek);
      
      if (updatedTrek.sections && updatedTrek.sections.itinerary) {
        const coordsAdded = updatedTrek.sections.itinerary.filter(day => day.coordinates).length;
        if (coordsAdded > 0) {
          updatedCount++;
          console.log(`  ✅ Added coordinates to ${coordsAdded} itinerary days`);
        }
      }
      
      return updatedTrek;
    });
    
    // Create backup
    const backupPath = treksPath + '.backup-' + Date.now();
    fs.writeFileSync(backupPath, fs.readFileSync(treksPath, 'utf8'));
    console.log(`💾 Backup created: ${backupPath}`);
    
    // Write updated data
    fs.writeFileSync(treksPath, JSON.stringify(treksData, null, 2));
    
    console.log(`\n🎉 Successfully added coordinates to ${updatedCount} treks!`);
    console.log(`📍 Total coordinate mappings available: ${Object.keys(locationCoordinates).length}`);
    
    // Summary statistics
    let totalDays = 0;
    let daysWithCoords = 0;
    
    treksData.treks.forEach(trek => {
      if (trek.sections && trek.sections.itinerary) {
        totalDays += trek.sections.itinerary.length;
        daysWithCoords += trek.sections.itinerary.filter(day => day.coordinates).length;
      }
    });
    
    console.log(`📊 Statistics:`);
    console.log(`   • Total itinerary days: ${totalDays}`);
    console.log(`   • Days with coordinates: ${daysWithCoords}`);
    console.log(`   • Coverage: ${((daysWithCoords / totalDays) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Error adding coordinates:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  addGeoCoordinates();
}

module.exports = { addGeoCoordinates, findCoordinates, locationCoordinates };
