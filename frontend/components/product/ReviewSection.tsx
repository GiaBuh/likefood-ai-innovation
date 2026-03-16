import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchProductReviews,
  fetchProductReviewStats,
  checkCanReview,
  createReview,
  uploadReviewImage,
  resolveImageUrl,
  ReviewResponse,
  ReviewStatsResponse,
} from '../../services/shopApi';

interface ReviewSectionProps {
  productId: string;
}

const StarRating: React.FC<{ rating: number; size?: string }> = ({ rating, size = '!text-base' }) => (
  <span className="inline-flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={`material-symbols-outlined ${size} ${
          star <= rating ? 'text-amber-400' : 'text-neutral-300 dark:text-neutral-600'
        }`}
        style={{ fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0" }}
      >
        star
      </span>
    ))}
  </span>
);

const InteractiveStarRating: React.FC<{ rating: number; onChange: (r: number) => void }> = ({ rating, onChange }) => (
  <span className="inline-flex gap-1 cursor-pointer">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className={`material-symbols-outlined !text-3xl transition-colors ${
          star <= rating ? 'text-amber-400 scale-110' : 'text-neutral-300 dark:text-neutral-600 hover:text-amber-300'
        }`}
        style={{ fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0" }}
      >
        star
      </button>
    ))}
  </span>
);

const ReviewSection: React.FC<ReviewSectionProps> = ({ productId }) => {
  const [stats, setStats] = useState<ReviewStatsResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activeRating, setActiveRating] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);

  // Review Form State
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [formImages, setFormImages] = useState<File[]>([]);
  const [formPreviewUrls, setFormPreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const s = await fetchProductReviewStats(productId);
      setStats(s);
    } catch (e) { /* ignore */ }
  }, [productId]);

  const loadReviews = useCallback(async (page: number = 0) => {
    setLoading(true);
    try {
      const res = await fetchProductReviews(productId, page, 5, activeRating, activeFilter !== 'all' ? activeFilter : undefined);
      setReviews(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
      setCurrentPage(page);
    } catch (e) { /* ignore */ }
    setLoading(false);
  }, [productId, activeRating, activeFilter]);

  useEffect(() => {
    loadStats();
    loadReviews(0);
    checkCanReview(productId).then(setCanReview);
  }, [productId]);

  useEffect(() => {
    loadReviews(0);
  }, [activeRating, activeFilter]);

  const handleFilterClick = (filterKey: string, rating?: number) => {
    if (rating !== undefined) {
      setActiveRating(activeRating === rating ? undefined : rating);
      setActiveFilter('all');
    } else {
      setActiveFilter(activeFilter === filterKey ? 'all' : filterKey);
      setActiveRating(undefined);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = [...formImages, ...files].slice(0, 3);
    setFormImages(newFiles);
    setFormPreviewUrls(newFiles.map(f => URL.createObjectURL(f)));
  };

  const handleRemoveImage = (index: number) => {
    const newFiles = formImages.filter((_, i) => i !== index);
    setFormImages(newFiles);
    setFormPreviewUrls(newFiles.map(f => URL.createObjectURL(f)));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      // Upload images first
      const imageKeys: string[] = [];
      for (const file of formImages) {
        const key = await uploadReviewImage(file);
        if (key) imageKeys.push(key);
      }

      await createReview({
        productId,
        orderId: '', // Will be filled by looking at the first eligible order
        rating: formRating,
        comment: formComment || undefined,
        imageKeys,
      });

      // Reset form
      setShowForm(false);
      setFormRating(5);
      setFormComment('');
      setFormImages([]);
      setFormPreviewUrls([]);

      // Reload
      await loadStats();
      await loadReviews(0);
      setCanReview(await checkCanReview(productId));
    } catch (err: any) {
      setSubmitError(err.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    }
    setSubmitting(false);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  return (
    <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-700" id="review-section">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined !text-2xl text-primary">rate_review</span>
        ĐÁNH GIÁ SẢN PHẨM
      </h2>

      {/* Stats + Filters */}
      <div className="bg-orange-50/60 dark:bg-neutral-800/50 rounded-2xl p-6 mb-6 border border-orange-100 dark:border-neutral-700">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Average Score */}
          <div className="flex flex-col items-center justify-center min-w-[120px]">
            <span className="text-4xl font-black text-primary">
              {stats ? stats.averageRating.toFixed(1) : '0.0'}
            </span>
            <span className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">trên 5</span>
            <StarRating rating={Math.round(stats?.averageRating || 0)} size="!text-lg" />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2 items-start">
            {/* All */}
            <button
              onClick={() => handleFilterClick('all')}
              className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                activeFilter === 'all' && activeRating === undefined
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-600 hover:border-primary'
              }`}
            >
              Tất Cả ({formatCount(stats?.totalReviews || 0)})
            </button>

            {/* Star filters */}
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => handleFilterClick('rating', star)}
                className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                  activeRating === star
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-600 hover:border-primary'
                }`}
              >
                {star} Sao ({formatCount(stats?.ratingCounts?.[star] || 0)})
              </button>
            ))}

            {/* Has Comment */}
            <button
              onClick={() => handleFilterClick('hasComment')}
              className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                activeFilter === 'hasComment'
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-600 hover:border-primary'
              }`}
            >
              Có Bình Luận ({formatCount(stats?.reviewsWithComments || 0)})
            </button>

            {/* Has Media */}
            <button
              onClick={() => handleFilterClick('hasMedia')}
              className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                activeFilter === 'hasMedia'
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-600 hover:border-primary'
              }`}
            >
              Có Hình Ảnh ({formatCount(stats?.reviewsWithImages || 0)})
            </button>
          </div>
        </div>
      </div>

      {/* Write Review Button */}
      {canReview && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-600 transition-colors shadow-md flex items-center gap-2"
        >
          <span className="material-symbols-outlined">edit</span>
          Viết Đánh Giá
        </button>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmitReview} className="mb-8 rounded-2xl border border-primary/20 bg-white dark:bg-neutral-800 p-6 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Đánh giá của bạn</h3>

          {/* Star rating */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Chất lượng sản phẩm:</span>
            <InteractiveStarRating rating={formRating} onChange={setFormRating} />
            <span className="text-sm font-bold text-primary">{formRating}/5</span>
          </div>

          {/* Comment */}
          <textarea
            value={formComment}
            onChange={(e) => setFormComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
            className="w-full p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none min-h-[120px] text-sm"
          />

          {/* Image Upload */}
          <div className="mt-4">
            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2 block">
              Thêm hình ảnh (tối đa 3 ảnh)
            </label>
            <div className="flex gap-3 flex-wrap">
              {formPreviewUrls.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {formImages.length < 3 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <span className="material-symbols-outlined text-neutral-400">add_photo_alternate</span>
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {submitError && (
            <p className="mt-3 text-sm text-red-500 font-medium">{submitError}</p>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined !text-lg">send</span>
              )}
              Gửi Đánh Giá
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Review List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-neutral-500 dark:text-neutral-400">
          <span className="material-symbols-outlined !text-5xl mb-3 block text-neutral-300 dark:text-neutral-600">reviews</span>
          <p className="text-lg font-medium">Chưa có đánh giá nào</p>
          <p className="text-sm mt-1">Hãy là người đầu tiên đánh giá sản phẩm này!</p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {reviews.map((review) => (
            <div key={review.id} className="py-6 first:pt-0 last:pb-0">
              {/* User Info Row */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden flex-shrink-0">
                  {review.userAvatarUrl ? (
                    <img src={resolveImageUrl(review.userAvatarUrl)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400 font-bold text-sm">
                      {(review.username || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">{review.username}</p>
                  <StarRating rating={review.rating} size="!text-sm" />
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {review.comment}
                </p>
              )}

              {/* Images */}
              {review.imageKeys && review.imageKeys.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {review.imageKeys.map((key, idx) => (
                    <button
                      key={idx}
                      onClick={() => setLightboxUrl(resolveImageUrl(key))}
                      className="w-20 h-20 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 hover:opacity-80 transition-opacity"
                    >
                      <img src={resolveImageUrl(key)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Shop Reply */}
              {review.replyText && (
                <div className="mt-4 ml-4 p-4 bg-orange-50/80 dark:bg-neutral-800/80 rounded-xl border border-orange-100/50 dark:border-neutral-700">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="material-symbols-outlined !text-base text-primary">storefront</span>
                    <span className="text-sm font-bold text-primary">Phản Hồi Của Người Bán</span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{review.replyText}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => loadReviews(currentPage - 1)}
            disabled={currentPage === 0}
            className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm font-bold disabled:opacity-30 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Trước
          </button>
          <span className="px-4 py-2 text-sm text-neutral-500">
            Trang {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => loadReviews(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm font-bold disabled:opacity-30 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Sau
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt=""
            className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/40 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
