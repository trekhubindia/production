'use client';
import { motion } from 'framer-motion';

export default function AdminGalleryPage() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-white">Gallery Management</h1>
      <p className="text-gray-400">This is the admin Gallery page. Add gallery management features here.</p>
    </motion.div>
  );
} 