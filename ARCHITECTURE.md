# Trek Website Architecture

## Overview

The trek website uses a hybrid data architecture where:
- **JSON files** contain static trek details (descriptions, itinerary, sections, etc.)
- **Database** contains dynamic data (prices, slots, gallery, status, featured flags)

## Data Flow

### 1. Trek Details Page (`/treks/[slug]`)

The trek details page combines data from two sources:

```typescript
// From JSON file (static content)
{
  name: "Adi Kailash & Om Parvat Trek",
  description: "Experience the divine beauty...",
  sections: {
    overview: { description: "...", highlights: [...] },
    whoCanParticipate: "...",
    howToReach: "...",
    costTerms: { inclusions: [...], exclusions: [...] },
    itinerary: [...],
    trekEssentials: { clothing: [...], footwear: [...], ... }
  }
}

// From Database (dynamic content)
{
  price: 25000,
  status: true,
  featured: true,
  slots: [...],
  gallery: [...]
}
```

### 2. Database Schema

The `treks` table now contains merged data (previously split between `treks` and `trek_dynamic_data`):

```sql
CREATE TABLE treks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    region TEXT,
    difficulty TEXT,
    duration TEXT,
    price NUMERIC DEFAULT 0,           -- Dynamic: from database
    rating NUMERIC DEFAULT 0,
    image TEXT,
    status BOOLEAN DEFAULT true,       -- Dynamic: visibility control
    featured BOOLEAN DEFAULT false,    -- Dynamic: featured flag
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Data Combination Logic

In `getTrekBySlug()` function:

```typescript
return {
  ...jsonTrek, // Static content: name, description, itinerary, sections, etc.
  price: dbTrek.price || jsonTrek.price, // Dynamic: price from database or JSON fallback
  status: dbTrek.status, // Dynamic: visibility status
  featured: dbTrek.featured, // Dynamic: featured status
  slots: slots || [], // Dynamic: available slots
  gallery: gallery // Dynamic: gallery images
};
```

## Benefits

1. **Performance**: Static content is served from JSON files (fast)
2. **Flexibility**: Dynamic content can be updated via admin panel
3. **Fallback**: If database is unavailable, JSON data is used
4. **SEO**: Static content is available for search engines

## File Structure

```
website/
├── data/
│   └── treks.json          # Static trek details
├── src/
│   ├── lib/
│   │   └── trek-data.ts    # Data fetching logic
│   └── app/
│       └── treks/
│           └── [slug]/
│               └── page.tsx # Trek details page
```

## Database Tables

- `treks` - Main trek data (merged from old `treks` + `trek_dynamic_data`)
- `trek_slots` - Available booking slots
- `trek_images` - Gallery images
- `bookings` - User bookings

## Migration Notes

The `trek_dynamic_data` table has been merged into the `treks` table. The code has been updated to reflect this change while maintaining backward compatibility. 