'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from 'framer-motion';
import { Product, ProductCategory } from '@/types/product';
import { formatPrice } from '@/utils/currency';
import Image from 'next/image';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Package,
  ChevronDown
} from 'lucide-react';

// Sample data - in a real app, this would come from an API
const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Whey Protein Powder',
    description: 'High-quality whey protein isolate for muscle building and recovery',
    price: 4999,
    originalPrice: 5999,
    image: '/api/placeholder/400/400',
    category: {
      id: '2',
      name: 'Protein',
      slug: 'protein',
      description: 'Protein powders, bars, and shakes',
      image: '/api/placeholder/300/200',
    },
    brand: 'NutriSap',
    inStock: true,
    stockQuantity: 25,
    rating: 4.8,
    reviewCount: 124,
    tags: ['protein', 'muscle-building', 'recovery'],
    type: 'physical' as const,
    benefits: ['Builds lean muscle mass', 'Supports muscle recovery', 'High protein content'],
    ingredients: ['Whey Protein Isolate', 'Natural Flavors', 'Stevia'],
    weight: '1kg',
    shippingInfo: {
      freeShipping: true,
      estimatedDelivery: '2-3 business days',
      weight: 1.2,
    },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'Organic Spirulina Powder',
    description: 'Pure organic spirulina powder rich in protein and nutrients',
    price: 2999,
    image: '/api/placeholder/400/400',
    category: {
      id: '3',
      name: 'Superfoods',
      slug: 'superfoods',
      description: 'Organic superfoods and natural products',
      image: '/api/placeholder/300/200',
    },
    brand: 'NutriSap',
    inStock: true,
    stockQuantity: 15,
    rating: 4.6,
    reviewCount: 89,
    tags: ['superfood', 'organic', 'protein'],
    type: 'physical' as const,
    benefits: ['Rich in protein and B vitamins', 'Supports immune system', 'Natural detoxification'],
    ingredients: ['100% Organic Spirulina'],
    weight: '250g',
    shippingInfo: {
      freeShipping: false,
      estimatedDelivery: '3-5 business days',
      weight: 0.3,
    },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '3',
    name: 'Multivitamin Complex',
    description: 'Complete multivitamin with essential vitamins and minerals',
    price: 1999,
    image: '/api/placeholder/400/400',
    category: {
      id: '1',
      name: 'Supplements',
      slug: 'supplements',
      description: 'Vitamins, minerals, and dietary supplements',
      image: '/api/placeholder/300/200',
    },
    brand: 'NutriSap',
    inStock: true,
    stockQuantity: 50,
    rating: 4.7,
    reviewCount: 203,
    tags: ['vitamins', 'minerals', 'daily'],
    type: 'physical' as const,
    benefits: ['Supports overall health', 'Boosts energy levels', 'Strengthens immune system'],
    ingredients: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'B-Complex', 'Minerals'],
    weight: '120 tablets',
    shippingInfo: {
      freeShipping: true,
      estimatedDelivery: '2-3 business days',
      weight: 0.2,
    },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

const sampleCategories: ProductCategory[] = [
  { id: '1', name: 'Supplements', slug: 'supplements', description: 'Vitamins, minerals, and dietary supplements', image: '/api/placeholder/300/200' },
  { id: '2', name: 'Protein', slug: 'protein', description: 'Protein powders, bars, and shakes', image: '/api/placeholder/300/200' },
  { id: '3', name: 'Superfoods', slug: 'superfoods', description: 'Organic superfoods and natural products', image: '/api/placeholder/300/200' },
  { id: '4', name: 'Meal Replacements', slug: 'meal-replacements', description: 'Nutritional meal replacement products', image: '/api/placeholder/300/200' },
  { id: '5', name: 'Wellness', slug: 'wellness', description: 'Health and wellness products', image: '/api/placeholder/300/200' },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(sampleProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const filterAndSortProducts = useCallback(() => {
    let filtered = [...products];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category.slug === selectedCategory);
    }

    // Sort products
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'stock':
          aValue = a.stockQuantity;
          bValue = b.stockQuantity;
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
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

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, sortBy, sortOrder, products]);

  useEffect(() => {
    filterAndSortProducts();
  }, [filterAndSortProducts]);


  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      setProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)));
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const getStockStatus = (product: Product) => {
    if (!product.inStock) return { text: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    if (product.stockQuantity < 10) return { text: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    return { text: 'In Stock', color: 'text-green-600 bg-green-100' };
  };

  return (
    <AdminSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600">Manage your product inventory</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.inStock).length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Package className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.inStock && p.stockQuantity < 10).length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <Package className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => !p.inStock).length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 w-full sm:w-64"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="all">All Categories</option>
                {sampleCategories.map(category => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <div className="flex space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="stock">Stock</option>
                  <option value="rating">Rating</option>
                  <option value="createdAt">Date Created</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <ChevronDown className={`w-4 h-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedProducts.length} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm"
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product, index) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 relative">
                            <Image
                              className="rounded-lg object-cover"
                              src={product.image}
                              alt={product.name}
                              fill
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.brand}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.category.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatPrice(product.price)}
                        </div>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <div className="text-sm text-gray-500 line-through">
                            {formatPrice(product.originalPrice)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.stockQuantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900 mr-1">
                            {product.rating}
                          </span>
                          <span className="text-yellow-400">★</span>
                          <span className="text-sm text-gray-500 ml-1">
                            ({product.reviewCount})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding a new product.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminSidebar>
  );
}


