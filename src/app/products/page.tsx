'use client';

import React, { useState, useEffect } from 'react';

import PageTransition from '@/components/PageTransition';
import FadeInSection from '@/components/FadeInSection';
import ProductCard from '@/components/ProductCard';
import Cart from '@/components/Cart';
import { Product, ProductCategory, ProductFilter, ProductSort } from '@/types/product';
import { Search, SortAsc, Grid, List } from 'lucide-react';

// Sample data - in a real app, this would come from an API
const sampleCategories: ProductCategory[] = [
  {
    id: '1',
    name: 'Supplements',
    slug: 'supplements',
    description: 'Vitamins, minerals, and dietary supplements',
    image: '/api/placeholder/300/200',
  },
  {
    id: '2',
    name: 'Protein',
    slug: 'protein',
    description: 'Protein powders, bars, and shakes',
    image: '/api/placeholder/300/200',
  },
  {
    id: '3',
    name: 'Superfoods',
    slug: 'superfoods',
    description: 'Organic superfoods and natural products',
    image: '/api/placeholder/300/200',
  },
  {
    id: '4',
    name: 'Meal Replacements',
    slug: 'meal-replacements',
    description: 'Nutritional meal replacement products',
    image: '/api/placeholder/300/200',
  },
  {
    id: '5',
    name: 'Wellness',
    slug: 'wellness',
    description: 'Health and wellness products',
    image: '/api/placeholder/300/200',
  },
];

const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Whey Protein Powder',
    description: 'High-quality whey protein isolate for muscle building and recovery',
    price: 499900,
    originalPrice: 599900,
    image: '/api/placeholder/400/400',
    category: sampleCategories[1],
    brand: 'NutriBrand',
    inStock: true,
    stockQuantity: 25,
    rating: 4.8,
    reviewCount: 124,
    tags: ['protein', 'muscle-building', 'recovery'],
    nutritionInfo: {
      calories: 120,
      protein: 25,
      carbs: 3,
      fat: 1,
      fiber: 0,
      sugar: 1,
      sodium: 50,
      servingSize: '1 scoop (30g)',
      servingsPerContainer: 33,
    },
    benefits: [
      'Builds lean muscle mass',
      'Supports muscle recovery',
      'High protein content',
      'Easy to digest',
    ],
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
    price: 299900,
    image: '/api/placeholder/400/400',
    category: sampleCategories[2],
    brand: 'NutriBrand',
    inStock: true,
    stockQuantity: 15,
    rating: 4.6,
    reviewCount: 89,
    tags: ['superfood', 'organic', 'protein'],
    benefits: [
      'Rich in protein and B vitamins',
      'Supports immune system',
      'Natural detoxification',
      'High in antioxidants',
    ],
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
    price: 199900,
    image: '/api/placeholder/400/400',
    category: sampleCategories[0],
    brand: 'NutriBrand',
    inStock: true,
    stockQuantity: 50,
    rating: 4.7,
    reviewCount: 203,
    tags: ['vitamins', 'minerals', 'daily'],
    benefits: [
      'Supports overall health',
      'Boosts energy levels',
      'Strengthens immune system',
      'Easy daily supplement',
    ],
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
  {
    id: '4',
    name: 'Plant-Based Protein Bar',
    description: 'Delicious plant-based protein bar with natural ingredients',
    price: 39900,
    image: '/api/placeholder/400/400',
    category: sampleCategories[1],
    brand: 'NutriBrand',
    inStock: true,
    stockQuantity: 100,
    rating: 4.5,
    reviewCount: 67,
    tags: ['plant-based', 'protein-bar', 'snack'],
    benefits: [
      'Plant-based protein',
      'No artificial ingredients',
      'Perfect on-the-go snack',
      'Satisfying and nutritious',
    ],
    ingredients: ['Pea Protein', 'Almonds', 'Dates', 'Cocoa', 'Natural Flavors'],
    weight: '60g',
    shippingInfo: {
      freeShipping: false,
      estimatedDelivery: '1-2 business days',
      weight: 0.1,
    },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '5',
    name: 'Omega-3 Fish Oil',
    description: 'High-potency omega-3 fish oil for heart and brain health',
    price: 249900,
    image: '/api/placeholder/400/400',
    category: sampleCategories[0],
    brand: 'NutriBrand',
    inStock: false,
    stockQuantity: 0,
    rating: 4.9,
    reviewCount: 156,
    tags: ['omega-3', 'fish-oil', 'heart-health'],
    benefits: [
      'Supports heart health',
      'Promotes brain function',
      'Reduces inflammation',
      'High potency formula',
    ],
    ingredients: ['Fish Oil', 'Omega-3 Fatty Acids', 'Vitamin E'],
    weight: '120 capsules',
    shippingInfo: {
      freeShipping: true,
      estimatedDelivery: '2-3 business days',
      weight: 0.3,
    },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '6',
    name: 'Green Tea Extract',
    description: 'Pure green tea extract with antioxidants and metabolism support',
    price: 159900,
    image: '/api/placeholder/400/400',
    category: sampleCategories[4],
    brand: 'NutriBrand',
    inStock: true,
    stockQuantity: 30,
    rating: 4.4,
    reviewCount: 92,
    tags: ['green-tea', 'antioxidants', 'metabolism'],
    benefits: [
      'Rich in antioxidants',
      'Supports metabolism',
      'Natural energy boost',
      'Promotes overall wellness',
    ],
    ingredients: ['Green Tea Extract', 'EGCG', 'Natural Flavors'],
    weight: '60 capsules',
    shippingInfo: {
      freeShipping: false,
      estimatedDelivery: '2-3 business days',
      weight: 0.1,
    },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

export default function ProductsPage() {
  const [products] = useState<Product[]>(sampleProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(sampleProducts);
  const [categories] = useState<ProductCategory[]>(sampleCategories);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  
  const [filters, setFilters] = useState<ProductFilter>({
    category: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    inStock: undefined,
    rating: undefined,
    search: '',
  });
  
  const [sorting, setSorting] = useState<ProductSort>({
    field: 'name',
    direction: 'asc',
  });

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products];

    // Apply filters
    if (filters.search) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
        product.description.toLowerCase().includes(filters.search!.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(filters.search!.toLowerCase()))
      );
    }

    if (filters.category) {
      filtered = filtered.filter(product => product.category.slug === filters.category);
    }

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(product => product.price >= filters.minPrice! * 100);
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(product => product.price <= filters.maxPrice! * 100);
    }

    if (filters.inStock !== undefined) {
      filtered = filtered.filter(product => product.inStock === filters.inStock);
    }

    if (filters.rating !== undefined) {
      filtered = filtered.filter(product => product.rating >= filters.rating!);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number;
      
      switch (sorting.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
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

      if (aValue < bValue) return sorting.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sorting.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProducts(filtered);
  }, [products, filters, sorting]);

  const handleFilterChange = (newFilters: Partial<ProductFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
      rating: undefined,
      search: '',
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== '' && value !== false
  ).length;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <section className="bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-700 dark:to-blue-700 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeInSection className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Nutrition Products
              </h1>
              <p className="text-xl text-green-100 max-w-3xl mx-auto">
                Discover our premium selection of nutrition supplements, superfoods, and wellness products
              </p>
            </FadeInSection>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Filters
                  </h2>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange({ search: e.target.value })}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => handleFilterChange({ category: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price Range
                  </label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Min price"
                      value={filters.minPrice || ''}
                      onChange={(e) => handleFilterChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Max price"
                      value={filters.maxPrice || ''}
                      onChange={(e) => handleFilterChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* In Stock Filter */}
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.inStock || false}
                      onChange={(e) => handleFilterChange({ inStock: e.target.checked || undefined })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      In Stock Only
                    </span>
                  </label>
                </div>

                {/* Rating Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.rating || ''}
                    onChange={(e) => handleFilterChange({ rating: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Any Rating</option>
                    <option value="4">4+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                    <option value="4.8">4.8+ Stars</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Showing {filteredProducts.length} of {products.length} products
                  </p>
                  {activeFiltersCount > 0 && (
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs">
                      {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} applied
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  {/* Sort */}
                  <div className="flex items-center space-x-2">
                    <SortAsc size={20} className="text-gray-400" />
                    <select
                      value={`${sorting.field}-${sorting.direction}`}
                      onChange={(e) => {
                        const [field, direction] = e.target.value.split('-') as [ProductSort['field'], ProductSort['direction']];
                        setSorting({ field, direction });
                      }}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="name-asc">Name A-Z</option>
                      <option value="name-desc">Name Z-A</option>
                      <option value="price-asc">Price Low to High</option>
                      <option value="price-desc">Price High to Low</option>
                      <option value="rating-desc">Highest Rated</option>
                      <option value="createdAt-desc">Newest First</option>
                    </select>
                  </div>

                  {/* View Mode */}
                  <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      <Grid size={20} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-green-600 text-white' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      <List size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-600 mb-4">
                    <Search size={64} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Try adjusting your filters or search terms
                  </p>
                  <button
                    onClick={clearFilters}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {filteredProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      delay={index * 0.1}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart */}
        <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    </PageTransition>
  );
}


