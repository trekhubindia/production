'use client';
import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHomepageData } from '@/hooks/useHomepageData';

interface GalleryPhotoItem {
  id: string;
  image_url: string;
  caption: string;
  trek?: string;
  location?: string;
}

// Incoming shape from useHomepageData (not exported), accommodate possible fields
type IncomingPhoto = {
  id: string;
  image_url?: string;
  image?: string;
  url?: string;
  caption?: string;
  title?: string;
  trek?: string;
  location?: string;
};

export default function PhotoGallerySection() {
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhotoItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data, loading, error } = useHomepageData();

  const openLightbox = (photo: GalleryPhotoItem, index: number) => {
    setSelectedPhoto(photo);
    setCurrentIndex(index);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
  };

  const nextPhoto = () => {
    const galleryPhotos = mappedGalleryPhotos;
    const nextIndex = (currentIndex + 1) % galleryPhotos.length;
    setCurrentIndex(nextIndex);
    setSelectedPhoto(galleryPhotos[nextIndex]);
  };

  const prevPhoto = () => {
    const galleryPhotos = mappedGalleryPhotos;
    const prevIndex = (currentIndex - 1 + galleryPhotos.length) % galleryPhotos.length;
    setCurrentIndex(prevIndex);
    setSelectedPhoto(galleryPhotos[prevIndex]);
  };

  if (loading) {
    return (
      <section className="photo-gallery py-20 bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">
              Trek Gallery
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore stunning moments from our treks across the Himalayas. Each photo tells a story of adventure, beauty, and unforgettable experiences.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 aspect-square rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="photo-gallery py-20 bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-primary mb-4">
              Trek Gallery
            </h2>
            <p className="text-red-500">Failed to load gallery. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  // Normalize incoming data to the local GalleryPhotoItem shape
  const mappedGalleryPhotos: GalleryPhotoItem[] = ((data.galleryPhotos || []) as IncomingPhoto[]).map((p) => ({
    id: p.id,
    image_url: p.image_url ?? p.image ?? p.url ?? '',
    caption: p.caption ?? p.title ?? '',
    trek: p.trek,
    location: p.location,
  }));

  return (
    <section className="photo-gallery py-20 bg-white dark:bg-background">
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-primary mb-4">
            Trek Gallery
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore stunning moments from our treks across the Himalayas. Each photo tells a story of adventure, beauty, and unforgettable experiences.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mappedGalleryPhotos.map((photo: GalleryPhotoItem, index: number) => (
            <div
              key={photo.id}
              className="gallery-item relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
              onClick={() => openLightbox(photo, index)}
            >
              <Image
                src={photo.image_url}
                alt={photo.caption}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end">
                <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <h4 className="font-semibold text-sm">{photo.caption}</h4>
                  {photo.trek && <p className="text-xs text-gray-200">{photo.trek}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <div className="relative max-w-4xl w-full">
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              >
                <X className="w-8 h-8" />
              </button>
              
              <div className="relative aspect-video">
                <Image
                  src={selectedPhoto.image_url}
                  alt={selectedPhoto.caption}
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
              
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-xl font-semibold mb-2">{selectedPhoto.caption}</h3>
                {selectedPhoto.trek && selectedPhoto.location && (
                  <p className="text-sm text-gray-200">{selectedPhoto.trek} • {selectedPhoto.location}</p>
                )}
              </div>

              <button
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              
              <button
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">1000+</div>
              <div className="text-muted-foreground">Photos Captured</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">15+</div>
              <div className="text-muted-foreground">Trek Destinations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">4 Seasons</div>
              <div className="text-muted-foreground">Year-round Beauty</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 