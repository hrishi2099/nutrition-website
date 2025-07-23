'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PageTransition from '@/components/PageTransition';
import FadeInSection from '@/components/FadeInSection';
import LoadingSpinner from '@/components/LoadingSpinner';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
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

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const postsResponse = await fetch('/api/blog/posts?published=true');
      const postsData = await postsResponse.json();
      
      if (postsData.success) {
        const foundPost = postsData.posts.find((p: BlogPost) => p.slug === slug);
        
        if (foundPost) {
          setPost(foundPost);
          
          const related = postsData.posts
            .filter((p: BlogPost) => p.id !== foundPost.id && p.category?.id === foundPost.category?.id)
            .slice(0, 3);
          setRelatedPosts(related);
        } else {
          setError('Post not found');
        }
      } else {
        setError('Failed to fetch post');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to fetch post');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <LoadingSpinner />
        </div>
      </PageTransition>
    );
  }

  if (error || !post) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error || 'Post not found'}
            </h1>
            <Link
              href="/blog"
              className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 font-medium"
            >
              ← Back to Blog
            </Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <article>
          <header className="bg-white dark:bg-gray-800">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <FadeInSection>
                <nav className="mb-8">
                  <Link
                    href="/blog"
                    className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 font-medium transition-colors"
                  >
                    ← Back to Blog
                  </Link>
                </nav>
                
                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    {post.category && (
                      <span className="bg-black dark:bg-white text-white dark:text-black px-3 py-1 text-sm rounded">
                        {post.category.name}
                      </span>
                    )}
                    <span className="text-gray-500 dark:text-gray-400">
                      {formatDate(post.publishedAt)}
                    </span>
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                    {post.title}
                  </h1>
                  
                  <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
                    <span>
                      By {post.author.firstName} {post.author.lastName}
                    </span>
                  </div>
                </div>

                {post.coverImage && (
                  <div className="mb-8">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
                    />
                  </div>
                )}
              </FadeInSection>
            </div>
          </header>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <FadeInSection delay={0.2}>
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm">
                <div 
                  className="prose prose-lg max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
                
                {post.tags.length > 0 && (
                  <div className="mt-8 pt-8 border-t dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tagRef) => (
                        <span
                          key={tagRef.tag.slug}
                          className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 text-sm rounded-full"
                        >
                          {tagRef.tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </FadeInSection>
          </div>
        </article>

        {relatedPosts.length > 0 && (
          <section className="bg-white dark:bg-gray-800 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <FadeInSection>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                  Related Articles
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {relatedPosts.map((relatedPost, index) => (
                    <FadeInSection key={relatedPost.id} delay={index * 0.1}>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        {relatedPost.coverImage && (
                          <div className="h-48 bg-gray-200">
                            <img
                              src={relatedPost.coverImage}
                              alt={relatedPost.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-6">
                          <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-white">
                            <Link
                              href={`/blog/${relatedPost.slug}`}
                              className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              {relatedPost.title}
                            </Link>
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                            {relatedPost.excerpt}
                          </p>
                          <Link
                            href={`/blog/${relatedPost.slug}`}
                            className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 font-medium text-sm transition-colors"
                          >
                            Read More →
                          </Link>
                        </div>
                      </div>
                    </FadeInSection>
                  ))}
                </div>
              </FadeInSection>
            </div>
          </section>
        )}
      </div>
    </PageTransition>
  );
}