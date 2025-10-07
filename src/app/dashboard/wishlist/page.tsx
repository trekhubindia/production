'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  HeartOff,
  Mountain, 
  MapPin, 
  Calendar, 
  Clock, 
  Star, 
  Users,
  Filter,
  Search,
  Grid,
  List,
  Plus,
  Share2,
  BookOpen,
  Trash2,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Types for wishlist data
interface WishlistItem {
  id: string;
  trekId: string;
  trekName: string;
  region: string;
  difficulty: string;
  duration: string;
  price: number;
  originalPrice: number;
  rating: number;
  image: string;
  altitude: string;
  bestSeason: string;
  addedDate: string;
  description: string;
  highlights: string[];
  available: boolean;
  nextSlot: string;
}

// Mock data for wishlist items (fallback)
const mockWishlistItems: WishlistItem[] = [
  {
    id: 'W001',
    trekId: 'annapurna-base-camp',
    trekName: 'Annapurna Base Camp Trek',
    region: 'Nepal',
    difficulty: 'Moderate',
    duration: '14 Days',
    price: 35999,
    originalPrice: 39999,
    rating: 4.8,
    image: '/images/annapurna.jpg',
    altitude: '4,130m',
    bestSeason: 'Oct-Nov, Mar-May',
    addedDate: '2024-09-15',
    description: 'Experience the majestic Annapurna massif with stunning mountain views and diverse landscapes.',
    highlights: ['Annapurna Base Camp', 'Poon Hill Sunrise', 'Rhododendron Forests', 'Local Culture'],
    available: true,
    nextSlot: '2024-11-15'
  },
  {
    id: 'W002',
    trekId: 'brahmatal-trek',
    trekName: 'Brahmatal Trek',
    region: 'Uttarakhand',
    difficulty: 'Easy',
    duration: '6 Days',
    price: 16999,
    originalPrice: 18999,
    rating: 4.6,
    image: '/images/brahmatal.jpg',
    altitude: '3,734m',
    bestSeason: 'Dec-Mar',
    addedDate: '2024-08-20',
    description: 'A perfect winter trek offering pristine snow-covered landscapes and frozen lakes.',
    highlights: ['Brahmatal Lake', 'Snow Trek', 'Oak & Rhododendron Forest', '360° Mountain Views'],
    available: true,
    nextSlot: '2024-12-10'
  },
  {
    id: 'W003',
    trekId: 'roopkund-trek',
    trekName: 'Roopkund Mystery Lake Trek',
    region: 'Uttarakhand',
    difficulty: 'Difficult',
    duration: '8 Days',
    price: 22999,
    originalPrice: 24999,
    rating: 4.7,
    image: '/images/roopkund.jpg',
    altitude: '5,029m',
    bestSeason: 'May-Jun, Sep-Oct',
    addedDate: '2024-07-10',
    description: 'Discover the mysterious skeleton lake with challenging terrain and breathtaking views.',
    highlights: ['Roopkund Lake', 'Ali & Bedni Bugyal', 'Junargali Ridge', 'Mystery Lake'],
    available: false,
    nextSlot: '2025-05-15'
  },
  {
    id: 'W004',
    trekId: 'everest-base-camp',
    trekName: 'Everest Base Camp Trek',
    region: 'Nepal',
    difficulty: 'Difficult',
    duration: '16 Days',
    price: 89999,
    originalPrice: 94999,
    rating: 4.9,
    image: '/images/everest-bc.jpg',
    altitude: '5,364m',
    bestSeason: 'Mar-May, Oct-Nov',
    addedDate: '2024-06-05',
    description: 'The ultimate trekking adventure to the base of the world\'s highest mountain.',
    highlights: ['Everest Base Camp', 'Kala Patthar', 'Sherpa Culture', 'Sagarmatha National Park'],
    available: true,
    nextSlot: '2024-10-20'
  },
  {
    id: 'W005',
    trekId: 'pin-parvati-pass',
    trekName: 'Pin Parvati Pass Trek',
    region: 'Himachal Pradesh',
    difficulty: 'Difficult',
    duration: '11 Days',
    price: 28999,
    originalPrice: 31999,
    rating: 4.5,
    image: '/images/pin-parvati.jpg',
    altitude: '5,319m',
    bestSeason: 'Jul-Sep',
    addedDate: '2024-05-18',
    description: 'Cross the challenging Pin Parvati Pass connecting Parvati and Pin valleys.',
    highlights: ['Pin Parvati Pass', 'Spiti Valley', 'Hot Springs', 'High Altitude Desert'],
    available: true,
    nextSlot: '2024-07-25'
  }
];

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('added-date');

  // Fetch wishlist data
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/wishlist');
        
        if (!response.ok) {
          throw new Error('Failed to fetch wishlist');
        }

        const data = await response.json();
        
        if (data.success) {
          setWishlistItems(data.wishlist);
        } else {
          throw new Error(data.error || 'Failed to fetch wishlist');
        }
      } catch (err) {
        console.error('Error fetching wishlist:', err);
        setError('Failed to load wishlist');
        // Use mock data as fallback
        setWishlistItems(mockWishlistItems);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const filteredItems = wishlistItems.filter(item => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'available' && item.available) ||
                         (filter === 'unavailable' && !item.available) ||
                         (filter === 'easy' && item.difficulty === 'Easy') ||
                         (filter === 'moderate' && item.difficulty === 'Moderate') ||
                         (filter === 'difficult' && item.difficulty === 'Difficult');
    
    const matchesSearch = item.trekName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.region.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'difficulty':
        const difficultyOrder = { 'Easy': 1, 'Moderate': 2, 'Difficult': 3 };
        return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - difficultyOrder[b.difficulty as keyof typeof difficultyOrder];
      case 'added-date':
      default:
        return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
    }
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Difficult':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    try {
      const response = await fetch(`/api/dashboard/wishlist/${itemId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setWishlistItems(prev => prev.filter(item => item.id !== itemId));
      } else {
        console.error('Failed to remove item from wishlist');
      }
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
    }
  };

  const shareWishlist = () => {
    // Generate shareable link
    const shareUrl = `${window.location.origin}/wishlist/shared`;
    navigator.clipboard.writeText(shareUrl);
    // You could show a toast notification here
    console.log('Wishlist link copied to clipboard');
  };

  const stats = {
    total: wishlistItems.length,
    available: wishlistItems.filter(item => item.available).length,
    totalValue: wishlistItems.reduce((sum, item) => sum + item.price, 0),
    avgRating: wishlistItems.length > 0 ? wishlistItems.reduce((sum, item) => sum + item.rating, 0) / wishlistItems.length : 0
  };

  return (
    <>
      <Head>
        <title>My Wishlist | Trek Hub India</title>
        <meta name="description" content="Your saved trekking adventures and dream destinations" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Page Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Wishlist</h1>
                <p className="text-gray-600 dark:text-gray-300">Your saved trekking adventures and dream destinations</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Saved Treks</p>
                <p className="text-2xl font-bold text-red-600">{wishlistItems.length}</p>
              </div>
            </div>
          </div>

        {/* Error State */}
        {error && (
          <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Error Loading Wishlist</h3>
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-red-600 hover:bg-red-700"
              >
                Retry
              </Button>
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-4 bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-800/20 border-red-200 dark:border-red-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.total}</p>
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">Saved Treks</p>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.available}</p>
              <p className="text-green-600 dark:text-green-400 text-sm font-medium">Available Now</p>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">₹{stats.totalValue.toLocaleString()}</p>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Value</p>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.avgRating.toFixed(1)}★</p>
              <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Avg Rating</p>
            </div>
          </Card>
          </div>
        )}

        {/* Controls */}
        {!loading && !error && (
          <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search wishlist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            
            {/* Filters and Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Dropdown */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="all">All Treks</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="difficult">Difficult</option>
              </select>
              
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="added-date">Recently Added</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="difficulty">Difficulty</option>
              </select>
              
              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-red-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-red-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          </Card>
        )}

        {/* Wishlist Items */}
        {!loading && !error && (
          filteredItems.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredItems.map((item) => (
              <Card key={item.id} className={`overflow-hidden hover:shadow-lg transition-all duration-300 ${viewMode === 'list' ? 'flex' : ''}`}>
                {/* Image */}
                <div className={`relative ${viewMode === 'grid' ? 'h-48' : 'w-48 flex-shrink-0'} bg-gray-200`}>
                  <div className="w-full h-full flex items-center justify-center">
                    <Mountain className="w-12 h-12 text-gray-400" />
                  </div>
                  
                  {/* Availability Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.available 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  
                  {/* Remove from Wishlist */}
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors group"
                  >
                    <Heart className="w-4 h-4 text-red-500 fill-current group-hover:text-red-600" />
                  </button>
                  
                  {/* Discount Badge */}
                  {item.originalPrice > item.price && (
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-bold">
                        Save ₹{(item.originalPrice - item.price).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {item.trekName}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {item.region}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {item.duration}
                        </div>
                      </div>
                    </div>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(item.difficulty)}`}>
                      {item.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    {item.description}
                  </p>
                  
                  {/* Trek Details */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mountain className="w-4 h-4" />
                      <span>{item.altitude}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{item.bestSeason}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{item.rating}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>Next: {new Date(item.nextSlot).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Highlights */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {item.highlights.slice(0, 3).map((highlight, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                          {highlight}
                        </span>
                      ))}
                      {item.highlights.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                          +{item.highlights.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Price and Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          ₹{item.price.toLocaleString()}
                        </span>
                        {item.originalPrice > item.price && (
                          <span className="text-sm text-gray-500 line-through">
                            ₹{item.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Added {new Date(item.addedDate).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link href={`/treks/${item.trekId}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      {item.available && (
                        <Link href={`/treks/${item.trekId}#book`}>
                          <Button size="sm" className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700">
                            <BookOpen className="w-4 h-4 mr-1" />
                            Book
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <HeartOff className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm || filter !== 'all' ? 'No matching treks found' : 'Your wishlist is empty'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Start exploring amazing treks and add them to your wishlist!'}
            </p>
            <Link href="/treks">
              <Button className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700">
                <Plus className="w-4 h-4 mr-2" />
                Explore Treks
              </Button>
            </Link>
            </Card>
          )
        )}
        </div>
      </div>
    </>
  );
}