'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from 'framer-motion';
import { Order } from '@/types/product';
import { 
  Search, 
  Filter, 
  Eye, 
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical
} from 'lucide-react';

// Sample data - in a real app, this would come from an API
const sampleOrders: Order[] = [
  {
    id: 'ORD-001',
    userId: 'user-1',
    items: [
      {
        product: {
          id: '1',
          name: 'Premium Whey Protein Powder',
          description: 'High-quality whey protein isolate',
          price: 4999,
          image: '/api/placeholder/100/100',
          category: { id: '2', name: 'Protein', slug: 'protein', description: 'Protein products', image: '' },
          brand: 'NutriSap',
          inStock: true,
          stockQuantity: 25,
          rating: 4.8,
          reviewCount: 124,
          tags: ['protein'],
          benefits: ['Muscle building'],
          ingredients: ['Whey Protein'],
          weight: '1kg',
          shippingInfo: { freeShipping: true, estimatedDelivery: '2-3 days', weight: 1.2 },
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        quantity: 2,
      }
    ],
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States',
    },
    paymentMethod: {
      type: 'card',
      cardNumber: '****1234',
      expiryDate: '12/25',
      cardholderName: 'John Doe',
    },
    status: 'processing',
    totalAmount: 9998,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    trackingNumber: 'TRK123456789',
  },
  {
    id: 'ORD-002',
    userId: 'user-2',
    items: [
      {
        product: {
          id: '2',
          name: 'Organic Spirulina Powder',
          description: 'Pure organic spirulina powder',
          price: 2999,
          image: '/api/placeholder/100/100',
          category: { id: '3', name: 'Superfoods', slug: 'superfoods', description: 'Superfoods', image: '' },
          brand: 'NutriSap',
          inStock: true,
          stockQuantity: 15,
          rating: 4.6,
          reviewCount: 89,
          tags: ['superfood'],
          benefits: ['Immune support'],
          ingredients: ['Spirulina'],
          weight: '250g',
          shippingInfo: { freeShipping: false, estimatedDelivery: '3-5 days', weight: 0.3 },
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        quantity: 1,
      }
    ],
    shippingAddress: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '+1234567891',
      address: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'United States',
    },
    paymentMethod: {
      type: 'paypal',
    },
    status: 'shipped',
    totalAmount: 2999,
    createdAt: '2024-01-14T14:20:00Z',
    updatedAt: '2024-01-16T09:15:00Z',
    trackingNumber: 'TRK987654321',
  },
  {
    id: 'ORD-003',
    userId: 'user-3',
    items: [
      {
        product: {
          id: '3',
          name: 'Multivitamin Complex',
          description: 'Complete multivitamin',
          price: 1999,
          image: '/api/placeholder/100/100',
          category: { id: '1', name: 'Supplements', slug: 'supplements', description: 'Supplements', image: '' },
          brand: 'NutriSap',
          inStock: true,
          stockQuantity: 50,
          rating: 4.7,
          reviewCount: 203,
          tags: ['vitamins'],
          benefits: ['Overall health'],
          ingredients: ['Vitamins'],
          weight: '120 tablets',
          shippingInfo: { freeShipping: true, estimatedDelivery: '2-3 days', weight: 0.2 },
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        quantity: 3,
      }
    ],
    shippingAddress: {
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob@example.com',
      phone: '+1234567892',
      address: '789 Pine St',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'United States',
    },
    paymentMethod: {
      type: 'card',
      cardNumber: '****5678',
      expiryDate: '06/26',
      cardholderName: 'Bob Johnson',
    },
    status: 'delivered',
    totalAmount: 5997,
    createdAt: '2024-01-10T08:45:00Z',
    updatedAt: '2024-01-12T16:30:00Z',
    trackingNumber: 'TRK456789123',
  },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(sampleOrders);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(sampleOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    filterAndSortOrders();
  }, [searchTerm, statusFilter, sortBy, sortOrder, orders]);

  const filterAndSortOrders = () => {
    let filtered = [...orders];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingAddress.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingAddress.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingAddress.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Sort orders
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'customer':
          aValue = `${a.shippingAddress.firstName} ${a.shippingAddress.lastName}`.toLowerCase();
          bValue = `${b.shippingAddress.firstName} ${b.shippingAddress.lastName}`.toLowerCase();
          break;
        case 'total':
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredOrders(filtered);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price / 100);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusCounts = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <AdminSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage customer orders and fulfillment</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <Package className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{statusCounts.total}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{statusCounts.pending}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Processing</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{statusCounts.processing}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                <Truck className="w-5 h-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Shipped</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{statusCounts.shipped}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-300" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Delivered</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{statusCounts.delivered}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-300" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Cancelled</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{statusCounts.cancelled}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-64"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-') as [string, 'asc' | 'desc'];
                  setSortBy(field);
                  setSortOrder(direction);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="total-desc">Highest Total</option>
                <option value="total-asc">Lowest Total</option>
                <option value="customer-asc">Customer A-Z</option>
                <option value="customer-desc">Customer Z-A</option>
                <option value="status-asc">Status A-Z</option>
                <option value="status-desc">Status Z-A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.id}
                      </div>
                      {order.trackingNumber && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Track: {order.trackingNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {order.shippingAddress.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {order.items[0]?.product.name}
                        {order.items.length > 1 && ` +${order.items.length - 1} more`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatPrice(order.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No orders have been placed yet.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminSidebar>
  );
}

