import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SEO from '../ui/SEO';

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
};

const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'bi-quyet-chon-dac-san',
    title: 'Bí Quyết Chọn Đặc Sản Việt Nam Chính Gốc',
    excerpt: 'Hướng dẫn chi tiết cách nhận biết và lựa chọn những đặc sản Việt Nam chất lượng nhất, từ hải sản khô đến trái cây nhiệt đới.',
    category: 'Hướng dẫn',
    date: '2024-03-10',
    readTime: '5 min',
    image: '',
  },
  {
    id: '2',
    slug: 'xu-huong-am-thuc-2024',
    title: 'Xu Hướng Ẩm Thực Việt Nam 2024',
    excerpt: 'Khám phá những xu hướng ẩm thực Việt Nam đang được yêu thích nhất trên TikTok và mạng xã hội.',
    category: 'Xu hướng',
    date: '2024-03-05',
    readTime: '4 min',
    image: '',
  },
  {
    id: '3',
    slug: 'cong-thuc-mon-viet',
    title: 'Công Thức Nấu Món Việt Đơn Giản Tại Nhà',
    excerpt: 'Tổng hợp các công thức nấu ăn Việt Nam dễ làm, phù hợp cho người Việt xa xứ muốn tự nấu tại nhà.',
    category: 'Công thức',
    date: '2024-02-28',
    readTime: '7 min',
    image: '',
  },
  {
    id: '4',
    slug: 'giao-hang-my',
    title: 'Hệ Thống Giao Hàng Đặc Sản Đến Mỹ',
    excerpt: 'Tìm hiểu quy trình đóng gói, bảo quản và vận chuyển đặc sản Việt Nam đến Mỹ đảm bảo chất lượng.',
    category: 'Logistics',
    date: '2024-02-20',
    readTime: '6 min',
    image: '',
  },
];

const CATEGORIES = ['Tất cả', 'Hướng dẫn', 'Xu hướng', 'Công thức', 'Logistics'];

const BlogPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  const filteredPosts = selectedCategory === 'Tất cả'
    ? BLOG_POSTS
    : BLOG_POSTS.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen">
      <SEO title={t('blog.title')} description={t('landing.heroSubtitle')} path="/blog" />
      {/* Header */}
      <section className="py-10 sm:py-16 lg:py-20 bg-gradient-to-br from-accent-50 via-white to-primary-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-900 dark:text-white mb-4">
            {t('blog.title')}
          </h1>
          <div className="w-16 h-1 bg-primary-500 mx-auto rounded-full mb-6"></div>
          <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto">
            {t('landing.heroSubtitle')}
          </p>
        </div>
      </section>

      {/* Category Filter & Posts */}
      <section className="py-12 bg-white dark:bg-neutral-900">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-10">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-primary-500 text-white shadow-button'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Blog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <article key={post.id} className="group bg-white dark:bg-neutral-800 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-neutral-100 dark:border-neutral-700">
                <div className="aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined !text-5xl text-primary-300 dark:text-primary-600 group-hover:scale-110 transition-transform">article</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                      {post.category}
                    </span>
                    <span className="text-xs text-neutral-500">{post.readTime}</span>
                  </div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-500 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">{t('blog.publishedOn')} {new Date(post.date).toLocaleDateString()}</span>
                    <span className="text-primary-500 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                      {t('blog.readMore')}
                      <span className="material-symbols-outlined !text-base">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-16 text-neutral-500 dark:text-neutral-400">
              <span className="material-symbols-outlined !text-5xl mb-4 opacity-50">article</span>
              <p>{t('common.noResults')}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BlogPage;
