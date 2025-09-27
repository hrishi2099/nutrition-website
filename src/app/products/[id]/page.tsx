'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

import PageTransition from '@/components/PageTransition';
import FadeInSection from '@/components/FadeInSection';
import AnimatedButton from '@/components/AnimatedButton';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/types/product';
import { ArrowLeft, Truck, Shield, RotateCcw, Heart, Share2 } from 'lucide-react';

// Sample product data - in a real app, this would come from an API
const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Whey Protein Powder',
    description: 'High-quality whey protein isolate for muscle building and recovery. This premium formula contains 25g of protein per serving with minimal carbs and fat, making it perfect for post-workout recovery and muscle building goals.',
    price: 499900,
    originalPrice: 599900,
    image: '/api/placeholder/600/600',
    images: ['/api/placeholder/600/600', '/api/placeholder/600/600', '/api/placeholder/600/600'],
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
      'No artificial flavors',
      'Gluten-free',
    ],
    ingredients: ['Whey Protein Isolate', 'Natural Flavors', 'Stevia', 'Cocoa Powder'],
    allergens: ['Milk'],
    weight: '1kg',
    dimensions: {
      length: 20,
      width: 15,
      height: 25,
    },
    shippingInfo: {
      freeShipping: true,
      estimatedDelivery: '2-3 business days',
      weight: 1.2,
    },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  // Add more sample products as needed
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart, isInCart, getItemQuantity } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    // In a real app, fetch product by ID from API
    const foundProduct = sampleProducts.find(p => p.id === params.id);
    setProduct(foundProduct || null);
  }, [params.id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price / 100);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${
          i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300 '
        }`}
      >
        ★
      </span>
    ));
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAdding(true);
    try {
      addToCart(product, quantity);
      // You could add a toast notification here
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stockQuantity ?? 0)) {
      setQuantity(newQuantity);
    }
  };

  if (!product) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Product not found
            </h1>
            <p className="text-gray-600 mb-6">
              The product you&apos;re looking for doesn&apos;t exist.
            </p>
            <AnimatedButton onClick={() => router.push('/products')}>
              Back to Products
            </AnimatedButton>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <button
              onClick={() => router.back()}
              className="hover:text-gray-700"
            >
              <ArrowLeft size={16} className="inline mr-1" />
              Back
            </button>
            <span>/</span>
            <button
              onClick={() => router.push('/products')}
              className="hover:text-gray-700"
            >
              Products
            </button>
            <span>/</span>
            <span className="text-gray-900">{product.category.name}</span>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <FadeInSection>
              <div className="space-y-4">
                {/* Main Image */}
                <div className="aspect-square relative overflow-hidden rounded-lg bg-white">
                  <Image
                    src={product.images?.[selectedImage] || product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </div>
                  )}
                </div>

                {/* Thumbnail Images */}
                {product.images && product.images.length > 1 && (
                  <div className="flex space-x-2">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`w-20 h-20 relative overflow-hidden rounded-lg border-2 ${
                          selectedImage === index
                            ? 'border-green-500'
                            : 'border-gray-200 '
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </FadeInSection>

            {/* Product Info */}
            <FadeInSection delay={0.2}>
              <div className="space-y-6">
                {/* Brand and Category */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {product.brand}
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">
                    {product.category.name}
                  </span>
                </div>

                {/* Product Name */}
                <h1 className="text-3xl font-bold text-gray-900">
                  {product.name}
                </h1>

                {/* Rating */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    {renderStars(product.rating)}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.rating} ({product.reviewCount} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center space-x-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>

                {/* Key Benefits */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Key Benefits
                  </h3>
                  <ul className="space-y-2">
                    {product.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2 mt-0.5">✓</span>
                        <span className="text-gray-600">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Quantity and Add to Cart */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700">
                      Quantity:
                    </span>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-gray-900">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(quantity + 1)}
                        disabled={quantity >= product.stockQuantity}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm text-gray-500">
                      {product.stockQuantity} in stock
                    </span>
                  </div>

                  <div className="flex space-x-4">
                    {isInCart(product.id) ? (
                      <div className="flex-1 bg-green-50 /20 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-green-700 font-medium">
                            In Cart ({getItemQuantity(product.id)})
                          </span>
                          <button
                            onClick={() => router.push('/cart')}
                            className="text-green-600 hover:underline text-sm"
                          >
                            View Cart
                          </button>
                        </div>
                      </div>
                    ) : (
                      <AnimatedButton
                        onClick={handleAddToCart}
                        disabled={!product.inStock || isAdding}
                        className={`flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 ${
                          !product.inStock
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        {isAdding ? 'Adding...' : !product.inStock ? 'Out of Stock' : 'Add to Cart'}
                      </AnimatedButton>
                    )}

                    <button
                      onClick={() => setIsWishlisted(!isWishlisted)}
                      className={`p-3 rounded-lg border ${
                        isWishlisted
                          ? 'border-red-500 text-red-500 bg-red-50 /20'
                          : 'border-gray-300 text-gray-500 hover:border-red-500 hover:text-red-500'
                      }`}
                    >
                      <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
                    </button>

                    <button className="p-3 rounded-lg border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600">
                      <Share2 size={20} />
                    </button>
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Truck className="text-green-500 mr-3" size={20} />
                      <span className="text-sm text-gray-600">
                        {product.shippingInfo.freeShipping ? 'Free shipping' : `$${product.shippingInfo.estimatedDelivery}`}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Shield className="text-green-500 mr-3" size={20} />
                      <span className="text-sm text-gray-600">
                        Secure checkout
                      </span>
                    </div>
                    <div className="flex items-center">
                      <RotateCcw className="text-green-500 mr-3" size={20} />
                      <span className="text-sm text-gray-600">
                        30-day return policy
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInSection>
          </div>

          {/* Product Details Tabs */}
          <FadeInSection delay={0.4}>
            <div className="mt-16">
              <div className="bg-white rounded-lg shadow-lg">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6">
                    {['Nutrition Facts', 'Ingredients', 'Shipping', 'Reviews'].map((tab) => (
                      <button
                        key={tab}
                        className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-6">
                  {/* Nutrition Facts */}
                  {product.nutritionInfo && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Nutrition Facts
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">
                            {product.nutritionInfo.calories}
                          </div>
                          <div className="text-sm text-gray-600">Calories</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">
                            {product.nutritionInfo.protein}g
                          </div>
                          <div className="text-sm text-gray-600">Protein</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">
                            {product.nutritionInfo.carbs}g
                          </div>
                          <div className="text-sm text-gray-600">Carbs</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">
                            {product.nutritionInfo.fat}g
                          </div>
                          <div className="text-sm text-gray-600">Fat</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        Serving size: {product.nutritionInfo.servingSize} ({product.nutritionInfo.servingsPerContainer} servings per container)
                      </p>
                    </div>
                  )}

                  {/* Ingredients */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Ingredients
                    </h3>
                    <p className="text-gray-600">
                      {product.ingredients.join(', ')}
                    </p>
                    {product.allergens && product.allergens.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Allergens:
                        </h4>
                        <p className="text-sm text-red-600">
                          Contains: {product.allergens.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </div>
    </PageTransition>
  );
}


