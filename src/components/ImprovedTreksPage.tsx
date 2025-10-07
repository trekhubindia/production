'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, Star, Mountain, Calendar, TrendingUp, Award, Zap, Search, Filter, SlidersHorizontal, Grid3X3, List, ChevronDown } from 'lucide-react';
import { Trek } from '@/lib/trek-data';
import TrekCard from './TrekCard';

interface ImprovedTreksPageProps {
  treks: Trek[];
}

type SortOption = 'name' | 'price-low' | 'price-high' | 'rating' | 'difficulty' | 'duration';
type ViewMode = 'grid' | 'list';

export default function ImprovedTreksPage({ treks }: ImprovedTreksPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search term to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Get unique regions and difficulties from treks
  const regions = useMemo(() => {
    const uniqueRegions = [...new Set(treks.map(trek => trek.region).filter(Boolean))];
    return uniqueRegions.sort();
  }, [treks]);

  const difficulties = useMemo(() => {
    const uniqueDifficulties = [...new Set(treks.map(trek => trek.difficulty).filter(Boolean))];
    return uniqueDifficulties.sort();
  }, [treks]);

  // Filter and sort treks with optimized performance
  const filteredAndSortedTreks = useMemo(() => {
    let filtered = treks.filter(trek => {
      const matchesSearch = !debouncedSearchTerm || 
        trek.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        trek.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        trek.region?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      const matchesRegion = !selectedRegion || trek.region === selectedRegion;
      const matchesDifficulty = !selectedDifficulty || trek.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesRegion && matchesDifficulty;
    });

    // Sort treks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'difficulty':
          const difficultyOrder = { 'Easy': 1, 'Moderate': 2, 'Difficult': 3 };
          return (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0) - 
                 (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0);
        case 'duration':
          const getDays = (duration: string) => parseInt(duration?.match(/\d+/)?.[0] || '0');
          return getDays(a.duration || '') - getDays(b.duration || '');
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

    return filtered;
  }, [treks, debouncedSearchTerm, selectedRegion, selectedDifficulty, sortBy]);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedRegion('');
    setSelectedDifficulty('');
    setSortBy('name');
  }, []);

  return (
    <>
      {/* Enhanced Hero Section */}
      <section className="relative min-h-[50vh] sm:min-h-[60vh] lg:min-h-[70vh] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        {/* Simplified background */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
        
        <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-4xl mx-auto py-8 sm:py-12">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white leading-tight">
            Discover Epic Treks
          </h1>
          
          <p className="text-base sm:text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed mb-6 sm:mb-8">
            Find your perfect Himalayan adventure from our curated collection of treks.
          </p>
          
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-white mb-1">{treks.length}+</div>
              <div className="text-gray-300 text-xs sm:text-sm">Treks</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-white mb-1">15+</div>
              <div className="text-gray-300 text-xs sm:text-sm">Regions</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-white mb-1">4.9★</div>
              <div className="text-gray-300 text-xs sm:text-sm">Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Search and Filter Section */}
      <section className="pb-12 sm:pb-16 lg:pb-20 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 -mt-8 sm:-mt-12 lg:-mt-16 rounded-t-3xl relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search and Filter Bar */}
          <div className="pt-6 sm:pt-8 lg:pt-12 pb-4 sm:pb-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              {/* Search Bar */}
              <div className="relative mb-4 sm:mb-6">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search treks..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full py-3.5 sm:py-4 pl-12 sm:pl-14 pr-4 sm:pr-6 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-base placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors bg-white dark:bg-gray-800"
                />
              </div>

              {/* Filter Toggle Button (Mobile) */}
              <div className="flex items-center justify-between mb-4 sm:hidden">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm min-h-[48px]"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  {/* Region Filter */}
                  <div className="relative">
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="w-full py-3.5 px-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors appearance-none min-h-[48px]"
                    >
                      <option value="">🌍 All Regions</option>
                      {regions.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty Filter */}
                  <div className="relative">
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full py-3.5 px-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors appearance-none min-h-[48px]"
                    >
                      <option value="">🏔️ All Difficulties</option>
                      {difficulties.map(difficulty => (
                        <option key={difficulty} value={difficulty}>{difficulty}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sort By */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="w-full py-3.5 px-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors appearance-none min-h-[48px]"
                    >
                      <option value="name">📝 Sort by Name</option>
                      <option value="price-low">💰 Price: Low to High</option>
                      <option value="price-high">💎 Price: High to Low</option>
                      <option value="rating">⭐ Highest Rated</option>
                      <option value="difficulty">🎯 Difficulty</option>
                      <option value="duration">⏱️ Duration</option>
                    </select>
                  </div>

                  {/* Clear Filters */}
                  <button
                    onClick={clearFilters}
                    className="py-3.5 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors min-h-[48px] flex items-center justify-center"
                  >
                    Clear All
                  </button>
                </div>

                {/* View Mode Toggle (Desktop) */}
                <div className="hidden sm:flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {filteredAndSortedTreks.length} of {treks.length} treks
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">View:</span>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Header */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm font-semibold mb-4 sm:mb-6">
              <Mountain className="w-4 h-4" />
              Explore Our Collection
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-gray-900 dark:text-white mb-4 sm:mb-6">
              Amazing Treks
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
              {searchTerm || selectedRegion || selectedDifficulty 
                ? `Found ${filteredAndSortedTreks.length} trek${filteredAndSortedTreks.length === 1 ? '' : 's'} matching your criteria`
                : `Discover ${filteredAndSortedTreks.length} incredible trek${filteredAndSortedTreks.length === 1 ? '' : 's'} waiting for you`
              }
            </p>
          </div>
          
          {/* Search Loading Indicator */}
          {searchTerm !== debouncedSearchTerm && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Searching...</span>
              </div>
            </div>
          )}

          {/* Treks Grid/List */}
          {searchTerm === debouncedSearchTerm && filteredAndSortedTreks.length > 0 ? (
            <div className={`${viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8' 
              : 'space-y-4 sm:space-y-6'
            }`}>
              {filteredAndSortedTreks.map((trek: Trek, index: number) => (
                <div
                  key={trek.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <TrekCard trek={trek} />
                </div>
              ))}
            </div>
          ) : searchTerm === debouncedSearchTerm ? (
            <div className="text-center py-12 sm:py-16">
              <div className="text-6xl sm:text-8xl mb-4 sm:mb-6">🏔️</div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-4">No treks found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto">
                Try adjusting your search criteria or explore our featured treks below.
              </p>
              <button
                onClick={clearFilters}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors min-h-[48px]"
              >
                Clear All Filters
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
