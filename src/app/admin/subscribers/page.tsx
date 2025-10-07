import { Metadata } from 'next';
import BlogSubscribersManager from '@/components/admin/BlogSubscribersManager';

export const metadata: Metadata = {
  title: 'Blog Subscribers | Admin Panel',
  description: 'Manage blog newsletter subscribers',
};

export default function AdminSubscribersPage() {
  return (
    <div className="p-6">
      <BlogSubscribersManager />
    </div>
  );
}
