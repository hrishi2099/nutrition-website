'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from 'framer-motion';
import { PdfPurchase } from '@/types/product';
import {
  FileText,
  Mail,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Eye
} from 'lucide-react';

export default function AdminPdfsPage() {
  const [purchases, setPurchases] = useState<PdfPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchPdfPurchases();
  }, []);

  const fetchPdfPurchases = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real app, this would call the admin API endpoint
      // For demo, we'll simulate some data
      const samplePurchases: PdfPurchase[] = [
        {
          id: 'pdf_1703781234567_abc123',
          userId: 'user-1',
          productId: 'pdf-1',
          orderId: 'ORDER_1703781234567',
          downloadLink: '/api/pdf/download/pdf_1703781234567_abc123',
          downloadCount: 2,
          maxDownloads: 5,
          purchaseDate: '2024-01-15T10:30:00Z',
          expiryDate: '2025-01-15T10:30:00Z',
          status: 'active',
          emailSent: true,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        },
        {
          id: 'pdf_1703781234568_def456',
          userId: 'user-2',
          productId: 'pdf-2',
          orderId: 'ORDER_1703781234568',
          downloadLink: '/api/pdf/download/pdf_1703781234568_def456',
          downloadCount: 1,
          maxDownloads: 3,
          purchaseDate: '2024-01-14T14:20:00Z',
          expiryDate: '2024-07-12T14:20:00Z',
          status: 'active',
          emailSent: true,
          createdAt: '2024-01-14T14:20:00Z',
          updatedAt: '2024-01-16T09:15:00Z',
        },
        {
          id: 'pdf_1703781234569_ghi789',
          userId: 'user-3',
          productId: 'pdf-3',
          orderId: 'ORDER_1703781234569',
          downloadLink: '/api/pdf/download/pdf_1703781234569_ghi789',
          downloadCount: 10,
          maxDownloads: 10,
          purchaseDate: '2024-01-10T08:45:00Z',
          expiryDate: '2026-01-10T08:45:00Z',
          status: 'active',
          emailSent: false,
          createdAt: '2024-01-10T08:45:00Z',
          updatedAt: '2024-01-12T16:30:00Z',
        },
      ];

      setPurchases(samplePurchases);
    } catch (err) {
      console.error('Error fetching PDF purchases:', err);
      setError(err instanceof Error ? err.message : 'Failed to load PDF purchases');
    } finally {
      setLoading(false);
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

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch =
      purchase.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.userId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getProductName = (productId: string) => {
    const productNames: { [key: string]: string } = {
      'pdf-1': 'Complete Nutrition Guide for Athletes',
      'pdf-2': 'Weight Loss Meal Plan & Recipe Book',
      'pdf-3': 'Supplement Stacking Guide',
    };
    return productNames[productId] || `Product ${productId}`;
  };

  const getStatusCounts = () => {
    return {
      total: purchases.length,
      active: purchases.filter(p => p.status === 'active').length,
      expired: purchases.filter(p => p.status === 'expired').length,
      revoked: purchases.filter(p => p.status === 'revoked').length,
      emailPending: purchases.filter(p => !p.emailSent).length,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <AdminSidebar>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2 text-gray-600">Loading PDF purchases...</span>
        </div>
      </AdminSidebar>
    );
  }

  if (error) {
    return (
      <AdminSidebar>
        <div className="text-center py-12">
          <XCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading PDF purchases</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchPdfPurchases}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </AdminSidebar>
    );
  }

  return (
    <AdminSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PDF Purchases</h1>
            <p className="text-gray-600">Manage PDF sales and customer access</p>
          </div>
          <button
            onClick={fetchPdfPurchases}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-xl font-bold text-gray-900">{statusCounts.total}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-xl font-bold text-gray-900">{statusCounts.active}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-red-100">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-xl font-bold text-gray-900">{statusCounts.expired}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-gray-100">
                <XCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Revoked</p>
                <p className="text-xl font-bold text-gray-900">{statusCounts.revoked}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-yellow-100">
                <Mail className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Email Pending</p>
                <p className="text-xl font-bold text-gray-900">{statusCounts.emailPending}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search purchases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 w-full sm:w-64"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Downloads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPurchases.map((purchase, index) => (
                  <motion.tr
                    key={purchase.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {purchase.id}
                      </div>
                      <div className="text-sm text-gray-500">
                        Order: {purchase.orderId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getProductName(purchase.productId)}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {purchase.productId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {purchase.userId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {purchase.downloadCount}/{purchase.maxDownloads}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(purchase.downloadCount / purchase.maxDownloads) * 100}%`
                          }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                        {getStatusIcon(purchase.status)}
                        <span className="ml-1 capitalize">{purchase.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {purchase.emailSent ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="ml-1 text-sm text-gray-900">
                          {purchase.emailSent ? 'Sent' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(purchase.purchaseDate)}
                      </div>
                      {purchase.expiryDate && (
                        <div className="text-sm text-gray-500">
                          Expires: {formatDate(purchase.expiryDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPurchases.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No PDF purchases found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No PDF purchases have been made yet.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminSidebar>
  );
}