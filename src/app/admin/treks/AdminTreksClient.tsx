'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Trek } from '@/lib/trek-data';
import TrekGallery from '@/components/TrekGallery';
import { 
  Star, 
  Sparkles, 
  Edit, 
  Save, 
  Plus, 
  Trash2, 
  EyeOff, 
  Users,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Mountain,
  Globe,
  Image as ImageIcon,
  Search
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AdminTreksClientProps {
  treks: Trek[];
}

export default function AdminTreksClient({ treks }: AdminTreksClientProps) {
  const [treksData, setTreksData] = useState(treks);
  const [loading, setLoading] = useState(false);
  const [editingTrek, setEditingTrek] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [featuredFilter, setFeaturedFilter] = useState<string>('all');
  const [message, setMessage] = useState('');
  const [showGallery, setShowGallery] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    price: '',
    status: true,
    featured: false,
    image: '',
    slots: [] as Array<{
      id: string;
      date: string;
      capacity: number;
      booked: number;
      status: string;
    }>
  });
  const [imageUpload, setImageUpload] = useState<{
    file: File | null;
    preview: string | null;
    uploading: boolean;
  }>({
    file: null,
    preview: null,
    uploading: false
  });

  const handleToggleStatus = async (trekId: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/treks/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trekId,
          updates: { status: !currentStatus }
        }),
      });

      const responseData = await res.json();

      if (res.ok) {
        setTreksData(prev => prev.map(trek =>
          trek.slug === trekId
            ? { ...trek, status: !currentStatus }
            : trek
        ));
        setMessage(`Trek status updated successfully!`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Failed to update trek status: ${responseData.error || 'Unknown error'}`);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (err) {
      setMessage(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (trekId: string, currentFeatured: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/treks/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trekId,
          updates: { featured: !currentFeatured }
        }),
      });

      const responseData = await res.json();

      if (res.ok) {
        setTreksData(prev => prev.map(trek =>
          trek.slug === trekId
            ? { ...trek, featured: !currentFeatured }
            : trek
        ));
        setMessage(`Trek featured status updated successfully!`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Failed to update trek featured status: ${responseData.error || 'Unknown error'}`);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (err) {
      setMessage(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTrek = (trek: Trek) => {
    setEditingTrek(trek.slug);
    setEditForm({
      price: trek.price ? trek.price.toString() : '',
      status: trek.status,
      featured: trek.featured || false,
      image: trek.image || '',
      slots: trek.slots || []
    });
    // Reset image upload state
    setImageUpload({
      file: null,
      preview: null,
      uploading: false
    });
  };

  const handleSaveEdit = async (trekSlug: string) => {
    setLoading(true);
    try {
      // Convert price string to number, handle empty string as 0
      const priceValue = editForm.price === '' ? 0 : Number(editForm.price);
      
      // Validate price
      if (isNaN(priceValue) || priceValue < 0) {
        setMessage('Please enter a valid price (0 or greater)');
        setTimeout(() => setMessage(''), 5000);
        setLoading(false);
        return;
      }
      
      const res = await fetch('/api/admin/treks/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trekId: trekSlug,
          updates: {
            price: priceValue,
            status: editForm.status,
            featured: editForm.featured,
            image: editForm.image,
            slots: editForm.slots
          }
        }),
      });

      const responseData = await res.json();

      if (res.ok) {
        setTreksData(prev => prev.map(trek =>
          trek.slug === trekSlug
            ? { 
                ...trek, 
                price: priceValue,
                status: editForm.status,
                featured: editForm.featured,
                image: editForm.image,
                slots: editForm.slots
              }
            : trek
        ));
        
        setEditingTrek(null);
        setMessage('Trek updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Failed to update trek: ${responseData.error || 'Unknown error'}`);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (err) {
      setMessage(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTrek(null);
    setImageUpload({
      file: null,
      preview: null,
      uploading: false
    });
  };

  const handleImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setMessage('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
        setTimeout(() => setMessage(''), 5000);
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setMessage('File too large. Maximum size is 5MB.');
        setTimeout(() => setMessage(''), 5000);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUpload({
          file,
          preview: e.target?.result as string,
          uploading: false
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async (trekSlug: string) => {
    if (!imageUpload.file) return;

    setImageUpload(prev => ({ ...prev, uploading: true }));

    try {
      const formData = new FormData();
      formData.append('file', imageUpload.file);
      formData.append('trekSlug', trekSlug);

      const res = await fetch('/api/admin/treks/upload-image', {
        method: 'POST',
        body: formData,
      });

      const responseData = await res.json();

      if (res.ok) {
        setEditForm(prev => ({ ...prev, image: responseData.imageUrl }));
        setMessage('Image uploaded successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Failed to upload image: ${responseData.error || 'Unknown error'}`);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      setMessage(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setImageUpload(prev => ({ ...prev, uploading: false }));
    }
  };

  const addSlot = () => {
    setEditForm(prev => ({
      ...prev,
      slots: [...prev.slots, {
        id: `temp-${Date.now()}`,
        date: '',
        capacity: 20,
        booked: 0,
        status: 'open'
      }]
    }));
  };

  const removeSlot = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index)
    }));
  };

  const updateSlot = (index: number, field: string, value: unknown) => {
    setEditForm(prev => ({
      ...prev,
      slots: prev.slots.map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const filteredTreks = treksData.filter(trek => {
    const matchesSearch = trek.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trek.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trek.difficulty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && trek.status) ||
                         (statusFilter === 'inactive' && !trek.status);
    const matchesFeatured = featuredFilter === 'all' ||
                           (featuredFilter === 'featured' && trek.featured) ||
                           (featuredFilter === 'not-featured' && !trek.featured);
    return matchesSearch && matchesStatus && matchesFeatured;
  });

  const stats = {
    total: treksData.length,
    active: treksData.filter(t => t.status).length,
    featured: treksData.filter(t => t.featured).length,
    regions: [...new Set(treksData.map(t => t.region))]
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
                Trek Management
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">Manage trek availability, pricing, and featured status</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Total Treks</p>
                    <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                    <Mountain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Active</p>
                    <p className="text-3xl font-bold text-foreground">{stats.active}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Featured</p>
                    <p className="text-3xl font-bold text-foreground">{stats.featured}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Regions</p>
                    <p className="text-3xl font-bold text-foreground">{stats.regions.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search treks by name, region, or difficulty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-6 py-4 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={featuredFilter}
                onChange={(e) => setFeaturedFilter(e.target.value)}
                className="px-6 py-4 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
              >
                <option value="all">All Featured</option>
                <option value="featured">Featured</option>
                <option value="not-featured">Not Featured</option>
              </select>
        </div>
      </div>

          {/* Message */}
          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className={`p-6 rounded-2xl border ${
                  message.includes('successfully') 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {message.includes('successfully') ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <AlertCircle className="w-6 h-6" />
                  )}
                  <span className="font-medium">{message}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Treks Grid */}
      <div className="grid gap-6">
            {filteredTreks.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mountain className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">No treks found</h3>
                <p className="text-muted-foreground text-lg">
                  {searchTerm || statusFilter !== 'all' || featuredFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'No treks available'
                  }
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredTreks.map((trek, index) => (
                  <motion.div
                    key={trek.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    layout
                  >
                    <Card className="hover:shadow-md transition-all duration-300 group">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-6">
                                                     {/* Image Section */}
                           <div className="relative w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                <Image
                  src={trek.image || '/images/placeholder.jpg'}
                  alt={trek.name}
                  fill
                               className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {trek.featured && (
                               <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3 h-3" />
                    Featured
                  </div>
                )}
              </div>

                          {/* Content Section */}
              <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div className="space-y-2">
                                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                                  {trek.name}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {trek.region}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {trek.duration}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {trek.difficulty}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span className="text-sm font-medium">{trek.rating}</span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">•</span>
                                  <span className="text-sm text-muted-foreground">
                                    {trek.slots?.length || 0} slots available
                                  </span>
                                </div>
                  </div>
                  <div className="text-right">
                                 <div className={`px-3 py-1 rounded-full text-xs font-semibold mb-2 inline-block ${
                                   trek.status 
                                     ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                                     : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                 }`}>
                                   {trek.status ? 'Active' : 'Inactive'}
                                 </div>
                                 <div className="text-2xl font-bold text-foreground">
                                   ₹{trek.price?.toLocaleString()}
                                 </div>
                                 <div className="text-sm text-muted-foreground">per person</div>
                  </div>
                </div>

                            {/* Edit Form */}
                {editingTrek === trek.slug ? (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-6 border-t pt-6"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Price (₹)</label>
                        <input
                          type="number"
                          value={editForm.price}
                          onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="Enter price (e.g., 15000)"
                          min="0"
                          step="1"
                                      className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Leave empty or enter 0 for free trek. You can clear the field completely.
                        </p>
                      </div>
                      <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                        <select
                          value={editForm.status.toString()}
                          onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value === 'true' }))}
                                      className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                                  <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Featured</label>
                                    <select
                                      value={editForm.featured.toString()}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, featured: e.target.value === 'true' }))}
                                      className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                                    >
                                      <option value="true">Featured</option>
                                      <option value="false">Not Featured</option>
                                    </select>
                    </div>
                    </div>

                    {/* Image Management Section */}
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-foreground">Trek Image</label>
                      
                      {/* Current Image Display */}
                      {(editForm.image || imageUpload.preview) && (
                        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-input">
                          <Image
                            src={imageUpload.preview || editForm.image}
                            alt="Trek image preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      {/* Image URL Input */}
                      <div>
                        <label className="block text-xs text-muted-foreground mb-2">Image URL</label>
                        <input
                          type="url"
                          placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                          value={editForm.image}
                          onChange={(e) => setEditForm(prev => ({ ...prev, image: e.target.value }))}
                          className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
                        />
                      </div>

                      {/* File Upload Section */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-xs text-muted-foreground mb-2">Or upload new image</label>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleImageFileSelect}
                            className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                          />
                        </div>
                        {imageUpload.file && (
                          <button
                            onClick={() => handleImageUpload(trek.slug)}
                            disabled={imageUpload.uploading}
                            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                          >
                            {imageUpload.uploading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-4 h-4" />
                                Upload
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Supported formats: JPEG, PNG, WebP. Maximum size: 5MB. Recommended size: 1200x675px (16:9 ratio)
                      </p>
                    </div>

                    <div>
                                  <div className="flex items-center justify-between mb-4">
                                    <label className="block text-sm font-medium text-foreground">Slots</label>
                                    <button
                                      onClick={addSlot}
                                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300 flex items-center gap-2"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add Slot
                                    </button>
                                  </div>
                                  <div className="space-y-3">
                        {editForm.slots.map((slot, index) => (
                                      <div key={index} className="flex gap-3 items-center">
                            <input
                              type="date"
                              value={slot.date}
                              onChange={(e) => updateSlot(index, 'date', e.target.value)}
                                          className="flex-1 px-4 py-3 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
                            />
                            <input
                              type="number"
                              placeholder="Capacity"
                              value={slot.capacity}
                              onChange={(e) => updateSlot(index, 'capacity', Number(e.target.value))}
                                          className="w-32 px-4 py-3 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
                            />
                            <input
                              type="number"
                              placeholder="Booked"
                              value={slot.booked}
                              onChange={(e) => updateSlot(index, 'booked', Number(e.target.value))}
                                          className="w-32 px-4 py-3 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
                            />
                            <button
                              onClick={() => removeSlot(index)}
                                          className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-300"
                            >
                                          <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                                <div className="flex gap-4 pt-4">
                      <button
                        onClick={() => handleSaveEdit(trek.slug)}
                        disabled={loading}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 disabled:scale-100 font-semibold"
                      >
                                    {loading ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                      </>
                                    )}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                              </motion.div>
                ) : (
                              /* Action Buttons */
                              <div className="flex items-center gap-3 pt-4 border-t">
                    <button
                      onClick={() => handleToggleStatus(trek.slug, trek.status)}
                      disabled={loading}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                        trek.status 
                                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                                      : 'bg-red-500 hover:bg-red-600 text-white'
                      } disabled:opacity-50`}
                    >
                                  {trek.status ? (
                                    <>
                                      <CheckCircle className="w-4 h-4" />
                                      Active
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="w-4 h-4" />
                                      Inactive
                                    </>
                                  )}
                    </button>
                    
                    <button
                      onClick={() => handleToggleFeatured(trek.slug, trek.featured || false)}
                      disabled={loading}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                        trek.featured 
                                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white' 
                                      : 'bg-muted hover:bg-muted/80 text-foreground'
                      } disabled:opacity-50`}
                    >
                                  <Sparkles className="w-4 h-4" />
                      {trek.featured ? 'Featured' : 'Not Featured'}
                    </button>

                    <button
                      onClick={() => handleEditTrek(trek)}
                                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all duration-300 flex items-center gap-2 text-sm font-medium"
                    >
                                  <Edit className="w-4 h-4" />
                      Edit
                    </button>

                    <button
                      onClick={() => setShowGallery(showGallery === trek.slug ? null : trek.slug)}
                                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-300 flex items-center gap-2 text-sm font-medium"
                    >
                                  <ImageIcon className="w-4 h-4" />
                      {showGallery === trek.slug ? 'Hide Gallery' : 'Gallery'}
                    </button>
                  </div>
                )}

                {/* Gallery Section */}
                {showGallery === trek.slug && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t pt-6 mt-6"
                  >
                    <TrekGallery trekSlug={trek.slug} trekName={trek.name} />
                  </motion.div>
                )}
              </div>
            </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 