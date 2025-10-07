import { NextRequest, NextResponse } from 'next/server';
import { updateTrekSlots, toggleTrekFeatured } from '@/lib/trek-data';
import { updateTrekDynamicData } from '@/lib/trek-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trekId, updates } = body;

    console.log('API called with:', { trekId, updates });

    if (!trekId || !updates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const results: Record<string, unknown> = {};

    // Handle featured status update separately
    if (updates.featured !== undefined) {
      console.log('Updating featured status for trek:', trekId, updates.featured);
      try {
        const featuredResult = await toggleTrekFeatured(trekId, updates.featured);
        results.featured = featuredResult;
        console.log('Featured status result:', featuredResult);
      } catch (error) {
        console.error('Featured status update failed:', error);
        return NextResponse.json({ 
          error: 'Failed to update trek featured status',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // Update dynamic data in database (price, status, image)
    if (updates.price !== undefined || updates.status !== undefined || updates.image !== undefined) {
      console.log('Updating dynamic data for trek:', trekId);
      try {
        const dynamicDataResult = await updateTrekDynamicData(trekId, {
          price: updates.price,
          status: updates.status,
          image: updates.image
        });
        results.dynamicData = dynamicDataResult;
        console.log('Dynamic data result:', dynamicDataResult);
      } catch (error) {
        console.error('Dynamic data update failed:', error);
        return NextResponse.json({ 
          error: 'Failed to update trek dynamic data',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // Update slots if provided
    if (updates.slots) {
      console.log('Updating slots for trek:', trekId);
      try {
        const slotsResult = await updateTrekSlots(trekId, updates.slots);
        results.slots = slotsResult;
        console.log('Slots result:', slotsResult);
      } catch (error) {
        console.error('Slots update failed:', error);
        return NextResponse.json({ 
          error: 'Failed to update trek slots',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Trek updated successfully',
      results,
      trek: {
        slug: trekId,
        price: updates.price,
        status: updates.status,
        featured: updates.featured,
        image: updates.image,
        slots: updates.slots || []
      }
    });

  } catch (error) {
    console.error('Error updating trek:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 