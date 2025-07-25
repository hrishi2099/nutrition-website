'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminProvider, useAdmin } from '@/contexts/AdminContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ErrorBoundaryWrapper } from '@/components/ErrorBoundary';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/login?redirect=/admin');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don&apos;t have permission to access this area.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryWrapper name="Admin Layout">
      <AdminProvider>
        <AdminLayoutContent>
          <ErrorBoundaryWrapper name="Admin Page Content">
            {children}
          </ErrorBoundaryWrapper>
        </AdminLayoutContent>
      </AdminProvider>
    </ErrorBoundaryWrapper>
  );
}