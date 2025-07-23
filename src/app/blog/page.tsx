'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageTransition from '@/components/PageTransition';
import FadeInSection from '@/components/FadeInSection';
import AnimatedCard from '@/components/AnimatedCard';
import LoadingSpinner from '@/components/LoadingSpinner';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  publishedAt: string;
  author: {
    firstName: string;
    lastName: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  tags: Array<{
    tag: {
      name: string;
      slug: string;
    };
  }>;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  _count: {
    posts: number;
  };
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [selectedCategory, currentPage]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        published: 'true',
        page: currentPage.toString(),
        limit: '6',
      });
      
      if (selectedCategory) {
        params.append('categoryId', selectedCategory);
      }

      const response = await fetch(`/api/blog/posts?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/blog/categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <section className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeInSection className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Nutrition Blog
              </h1>
              <p className="text-xl text-gray-300 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
                Expert insights, tips, and science-backed articles to help you on your wellness journey.
              </p>
            </FadeInSection>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <aside className="lg:w-1/4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm sticky top-24">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Categories</h3>
                  <ul className="space-y-2">
                    <li>
                      <button
                        onClick={() => handleCategoryChange('')}
                        className={`w-full text-left px-3 py-2 rounded transition-colors ${
                          selectedCategory === '' 
                            ? 'bg-black dark:bg-white text-white dark:text-black' 
                            : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        All Posts
                      </button>
                    </li>
                    {categories.map((category) => (
                      <li key={category.id}>
                        <button
                          onClick={() => handleCategoryChange(category.id)}
                          className={`w-full text-left px-3 py-2 rounded transition-colors ${
                            selectedCategory === category.id 
                              ? 'bg-black dark:bg-white text-white dark:text-black' 
                              : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {category.name} ({category._count.posts})
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>

              <main className="lg:w-3/4">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      {posts.map((post, index) => (
                        <AnimatedCard
                          key={post.id}
                          delay={index * 0.1}
                          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                        >
                          {post.coverImage && (
                            <div className="h-48 bg-gray-200">
                              <img
                                src={post.coverImage}
                                alt={post.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="p-6">
                            <div className="flex items-center gap-2 mb-3">
                              {post.category && (
                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 text-xs rounded">
                                  {post.category.name}
                                </span>
                              )}
                              <span className="text-gray-500 dark:text-gray-400 text-xs">
                                {formatDate(post.publishedAt)}
                              </span>
                            </div>
                            <h3 className="text-xl font-semibold mb-3 line-clamp-2 text-gray-900 dark:text-white">
                              <Link
                                href={`/blog/${post.slug}`}
                                className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              >
                                {post.title}
                              </Link>
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                              {post.excerpt}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                By {post.author.firstName} {post.author.lastName}
                              </span>
                              <Link
                                href={`/blog/${post.slug}`}
                                className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 font-medium text-sm transition-colors"
                              >
                                Read More →
                              </Link>
                            </div>
                          </div>
                        </AnimatedCard>
                      ))}
                    </div>

                    {posts.length === 0 && !loading && (
                      <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                          No posts found in this category.
                        </p>
                      </div>
                    )}

                    {totalPages > 1 && (
                      <div className="flex justify-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-4 py-2 rounded transition-colors ${
                              currentPage === page
                                ? 'bg-black dark:bg-white text-white dark:text-black'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border dark:border-gray-600'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </main>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}