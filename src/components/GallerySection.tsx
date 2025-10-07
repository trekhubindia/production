'use client';
import React, { useState } from 'react';
import Image from 'next/image';

interface GallerySectionProps {
  gallery: { url?: string; image_url?: string; caption?: string }[];
}

const GallerySection: React.FC<GallerySectionProps> = ({ gallery }) => {
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  if (!gallery || gallery.length === 0) return null;
  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Gallery</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Photos from this trek</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {gallery.map((image, index) => (
          <div
            key={index}
            className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 cursor-pointer group bg-gray-100 dark:bg-gray-700"
            onClick={() => setModalIndex(index)}
          >
            <Image
              src={image.url || image.image_url || '/images/placeholder.jpg'}
              alt={image.caption || ''}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <p className="text-white text-sm font-medium">{image.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Modal/Lightbox */}
      {modalIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={() => setModalIndex(null)}>
          <div className="relative w-full max-w-3xl aspect-video">
            <Image
              src={gallery[modalIndex].url || gallery[modalIndex].image_url || '/images/placeholder.jpg'}
              alt={gallery[modalIndex].caption || ''}
              fill
              className="object-contain rounded-lg"
            />
            {gallery[modalIndex].caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <p className="text-white text-sm font-medium">{gallery[modalIndex].caption}</p>
              </div>
            )}
            <button className="absolute top-4 right-4 text-white text-2xl font-bold bg-black/60 rounded-full px-3 py-1 hover:bg-black/80 transition-colors duration-200" onClick={e => { e.stopPropagation(); setModalIndex(null); }}>×</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default GallerySection; 