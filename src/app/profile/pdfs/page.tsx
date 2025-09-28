'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import PageTransition from '@/components/PageTransition';
import FadeInSection from '@/components/FadeInSection';
import { useAuth } from '@/contexts/AuthContext';
import { PdfPurchase } from '@/types/product';
import {
  FileText,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  RefreshCw
} from 'lucide-react';

export default function UserPdfsPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<PdfPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPdfPurchases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/pdf/purchase?userId=${user?.id || 'demo-user-id'}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch PDF purchases');
      }

      const data = await response.json();
      setPurchases(data.purchases || []);
    } catch (err) {
      console.error('Error fetching PDF purchases:', err);
      setError(err instanceof Error ? err.message : 'Failed to load PDF purchases');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchPdfPurchases();
    }
  }, [user, fetchPdfPurchases]);

  const handleDownload = async (purchaseId: string) => {
    try {
      // Check download status first
      const statusResponse = await fetch(`/api/pdf/download/${purchaseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'check_status' }),
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to check download status');
      }

      const statusData = await statusResponse.json();

      if (!statusData.validation.valid) {
        alert(`Cannot download: ${statusData.validation.reason}`);
        return;
      }

      // Proceed with download
      const downloadUrl = `/api/pdf/download/${purchaseId}`;
      window.open(downloadUrl, '_blank');

      // Refresh the purchases list to update download count
      await fetchPdfPurchases();
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'revoked':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'expired':
        return <Clock className="w-4 h-4 text-red-500" />;
      case 'revoked':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-2 text-gray-600">Loading your PDFs...</span>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <XCircle className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading PDFs</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <button
                onClick={fetchPdfPurchases}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My PDFs</h1>
              <p className="text-gray-600 mt-2">Access your purchased digital content</p>
            </div>
            <button
              onClick={fetchPdfPurchases}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>

          {purchases.length === 0 ? (
            <FadeInSection>
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No PDFs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You haven&apos;t purchased any PDF products yet.
                </p>
                <Link
                  href="/products"
                  className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Browse Products
                </Link>
              </div>
            </FadeInSection>
          ) : (
            <div className="space-y-6">
              {purchases.map((purchase, index) => (
                <motion.div
                  key={purchase.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <FileText className="w-6 h-6 text-green-600" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
                            PDF Product #{purchase.productId}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Purchase ID: {purchase.id}
                          </p>
                          <p className="text-sm text-gray-500">
                            Purchased: {formatDate(purchase.purchaseDate)}
                          </p>

                          <div className="flex items-center space-x-4 mt-3">
                            <div className="flex items-center space-x-1">
                              <Download className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {purchase.downloadCount}/{purchase.maxDownloads} downloads
                              </span>
                            </div>

                            {purchase.expiryDate && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  Expires: {formatDate(purchase.expiryDate)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                          {getStatusIcon(purchase.status)}
                          <span className="ml-1 capitalize">{purchase.status}</span>
                        </span>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDownload(purchase.id)}
                            disabled={purchase.status !== 'active' || purchase.downloadCount >= purchase.maxDownloads}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar for downloads */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Download Progress</span>
                        <span>{purchase.downloadCount}/{purchase.maxDownloads}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${(purchase.downloadCount / purchase.maxDownloads) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}