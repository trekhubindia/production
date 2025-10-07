import { NextRequest, NextResponse } from 'next/server';
import { createStorageClient } from '@/lib/storage-client';

// Create storage client for custom auth
const supabase = createStorageClient();

// GET - Fetch trek gallery images
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trekSlug } = await params;

    // Get trek images
    const { data: images, error } = await supabase
      .from('trek_images')
      .select('*')
      .eq('trek_slug', trekSlug)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching trek images:', error);
      return NextResponse.json({ error: 'Failed to fetch trek images' }, { status: 500 });
    }

    return NextResponse.json({ images: images || [] });
  } catch (error) {
    console.error('Error in GET trek gallery:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Upload new image to trek gallery
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trekSlug } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const altText = formData.get('altText') as string;
    const caption = formData.get('caption') as string;
    const isFeatured = formData.get('isFeatured') === 'true';

    // Debug environment variables
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Service Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('Service Key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size too large. Maximum size is 5MB.' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${trekSlug}-${timestamp}.${fileExtension}`;

    // Test bucket access first
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    console.log('Available buckets:', buckets);
    console.log('Buckets error:', bucketsError);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('trek-gallery')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      console.error('Upload error details:', {
        message: uploadError.message,
        statusCode: (uploadError as { statusCode?: number }).statusCode,
        name: uploadError.name
      });
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('trek-gallery')
      .getPublicUrl(fileName);

    // Get current max sort_order
    const { data: maxOrderData } = await supabase
      .from('trek_images')
      .select('sort_order')
      .eq('trek_slug', trekSlug)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = maxOrderData && maxOrderData.length > 0 
      ? (maxOrderData[0].sort_order || 0) + 1 
      : 0;

    // Insert image record
    const { data: imageData, error: insertError } = await supabase
      .from('trek_images')
      .insert({
        trek_slug: trekSlug,
        image_url: publicUrl,
        alt_text: altText || file.name,
        caption: caption || '',
        sort_order: nextSortOrder,
        is_featured: isFeatured
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting image record:', insertError);
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('trek-gallery').remove([fileName]);
      return NextResponse.json({ error: 'Failed to save image record' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Image uploaded successfully',
      image: imageData 
    });
  } catch (error) {
    console.error('Error in POST trek gallery:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete image from trek gallery
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trekSlug } = await params;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    // Get image details before deletion
    const { data: imageData, error: fetchError } = await supabase
      .from('trek_images')
      .select('image_url')
      .eq('id', imageId)
      .eq('trek_slug', trekSlug)
      .single();

    if (fetchError || !imageData) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Extract filename from URL
    const urlParts = imageData.image_url.split('/');
    const fileName = urlParts[urlParts.length - 1];

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('trek-gallery')
      .remove([fileName]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('trek_images')
      .delete()
      .eq('id', imageId)
      .eq('trek_slug', trekSlug);

    if (deleteError) {
      console.error('Error deleting image record:', deleteError);
      return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE trek gallery:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update image details (caption, alt text, featured status, sort order)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trekSlug } = await params;
    const body = await request.json();
    const { imageId, updates } = body;

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    // Validate updates
    const allowedUpdates = ['alt_text', 'caption', 'is_featured', 'sort_order'];
    const validUpdates: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        validUpdates[key] = value;
      }
    }

    if (Object.keys(validUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    // Update image record
    const { data: updatedImage, error: updateError } = await supabase
      .from('trek_images')
      .update(validUpdates)
      .eq('id', imageId)
      .eq('trek_slug', trekSlug)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating image:', updateError);
      return NextResponse.json({ error: 'Failed to update image' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Image updated successfully',
      image: updatedImage 
    });
  } catch (error) {
    console.error('Error in PUT trek gallery:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 