'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Upload, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Star, 
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TrekImage {
  id: string;
  image_url: string;
  alt_text: string;
  caption: string;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
}

interface TrekGalleryProps {
  trekSlug: string;
  trekName: string;
}

export default function TrekGallery({ trekSlug, trekName }: TrekGalleryProps) {
  const [images, setImages] = useState<TrekImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    alt_text: '',
    caption: '',
    is_featured: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch images on component mount
  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/treks/${trekSlug}/gallery`);
      const data = await response.json();
      
      if (response.ok) {
        setImages(data.images || []);
      } else {
        setMessage(`Failed to fetch images: ${data.error}`);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      setMessage(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  }, [trekSlug]);

  // Load images on mount
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('altText', file.name);
      formData.append('caption', '');
      formData.append('isFeatured', 'false');

      const response = await fetch(`/api/admin/treks/${trekSlug}/gallery`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setImages(prev => [...prev, data.image]);
        setMessage('Image uploaded successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Upload failed: ${data.error}`);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      setMessage(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/treks/${trekSlug}/gallery?imageId=${imageId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setImages(prev => prev.filter(img => img.id !== imageId));
        setMessage('Image deleted successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Delete failed: ${data.error}`);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      setMessage(`Delete error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleEditImage = (image: TrekImage) => {
    setEditingImage(image.id);
    setEditForm({
      alt_text: image.alt_text,
      caption: image.caption,
      is_featured: image.is_featured
    });
  };

  const handleSaveEdit = async (imageId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/treks/${trekSlug}/gallery`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId,
          updates: editForm
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setImages(prev => prev.map(img => 
          img.id === imageId ? { ...img, ...editForm } : img
        ));
        setEditingImage(null);
        setMessage('Image updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Update failed: ${data.error}`);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      setMessage(`Update error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (newOrder: TrekImage[]) => {
    setImages(newOrder);
    
    // Update sort orders in database
    try {
      for (let i = 0; i < newOrder.length; i++) {
        await fetch(`/api/admin/treks/${trekSlug}/gallery`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageId: newOrder[i].id,
            updates: { sort_order: i }
          }),
        });
      }
    } catch (error) {
      console.error('Error updating sort order:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground">Trek Gallery</h3>
          <p className="text-muted-foreground">Manage images for {trekName}</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Image
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`p-4 rounded-lg border ${
              message.includes('successfully') 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.includes('successfully') ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gallery Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="w-full h-48 bg-muted rounded-lg mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No images yet</h3>
          <p className="text-muted-foreground mb-4">Upload images to create a gallery for this trek</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all duration-300"
          >
            Upload First Image
          </button>
        </div>
      ) : (
        <Reorder.Group 
          axis="y" 
          values={images} 
          onReorder={handleReorder}
          className="space-y-4"
        >
          {images.map((image) => (
            <Reorder.Item key={image.id} value={image}>
              <Card className="hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={image.image_url}
                        alt={image.alt_text}
                        fill
                        className="object-cover"
                      />
                      {image.is_featured && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Featured
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-3">
                      {editingImage === image.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Alt Text</label>
                            <input
                              type="text"
                              value={editForm.alt_text}
                              onChange={(e) => setEditForm(prev => ({ ...prev, alt_text: e.target.value }))}
                              className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Caption</label>
                            <input
                              type="text"
                              value={editForm.caption}
                              onChange={(e) => setEditForm(prev => ({ ...prev, caption: e.target.value }))}
                              className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`featured-${image.id}`}
                              checked={editForm.is_featured}
                              onChange={(e) => setEditForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                              className="rounded"
                            />
                            <label htmlFor={`featured-${image.id}`} className="text-sm font-medium text-foreground">
                              Featured Image
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(image.id)}
                              disabled={loading}
                              className="px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm transition-all duration-300 flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingImage(null)}
                              className="px-3 py-1 bg-muted hover:bg-muted/80 text-foreground rounded text-sm transition-all duration-300 flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{image.alt_text}</h4>
                              {image.caption && (
                                <p className="text-sm text-muted-foreground mt-1">{image.caption}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                Uploaded: {new Date(image.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditImage(image)}
                                className="p-2 bg-muted hover:bg-muted/80 text-foreground rounded transition-all duration-300"
                                title="Edit image"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteImage(image.id)}
                                disabled={loading}
                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded transition-all duration-300 disabled:opacity-50"
                                title="Delete image"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </div>
  );
} 