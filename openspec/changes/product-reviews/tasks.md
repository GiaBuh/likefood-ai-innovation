## 1. Database & Schema

- [ ] 1.1 Create `reviews` table migration (user_id, product_id, order_id, rating, comment, reply_text, replied_at).
- [ ] 1.2 Create `review_images` table migration (review_id, image_url).
- [ ] 1.3 Add `average_rating` and `review_count` columns to the `products` table migration.
- [ ] 1.4 Update database models/entities for Review, ReviewImage, and Product.

## 2. Backend API (Core Reviews)

- [ ] 2.1 Implement `POST /api/products/{id}/reviews` (Validate user has COMPLETED order for product).
- [ ] 2.2 Implement `GET /api/products/{id}/reviews` with pagination, filtering by rating, and filtering by hasMedia.
- [ ] 2.3 Implement media upload endpoint for review images (uploading to S3/Cloud Storage and returning URLs).
- [ ] 2.4 Implement background job or trigger to update `Product.average_rating` and `Product.review_count` when reviews change.

## 3. Backend API (Admin/Shop Replies)

- [ ] 3.1 Implement `POST /api/admin/reviews/{id}/reply` to allow shop to update `reply_text` on a review.
- [ ] 3.2 Implement `GET /api/admin/reviews` for the admin dashboard to manage all reviews.

## 4. Frontend (Customer Page - UI & Display)

- [ ] 4.1 Update `ProductCard.tsx` and `ProductDetail.tsx` to display the product's aggregated star rating.
- [ ] 4.2 Create `ReviewSection.tsx` component within the Product Details page.
- [ ] 4.3 Create `ReviewList.tsx` and `ReviewItem.tsx` to display individual reviews, user info, stars, comments, and images.
- [ ] 4.4 Implement filtering UI (Buttons for "All", "5 Star", "Has Image", etc.) in the Review Section and wire it to the API.
- [ ] 4.5 Update `ReviewItem.tsx` to display the "Phản Hồi Của Người Bán" (Shop Reply) block if `reply_text` exists.

## 5. Frontend (Customer Page - Submission)

- [ ] 5.1 Create `ReviewFormModal.tsx` allowing a user to select a 1-5 star rating and type a comment.
- [ ] 5.2 Add Image/Media uploader component to the review form.
- [ ] 5.3 Implement conditional rendering: Only show "Viết Đánh Giá" button if the current user owns a `COMPLETED` order for this product.
- [ ] 5.4 Wire up the form submission to the `POST` review API.

## 6. Frontend (Admin Dashboard)

- [ ] 6.1 Create an "Reviews Management" page in the Admin Dashboard.
- [ ] 6.2 Implement UI for shop admins to view all reviews and filter by "Needs Reply".
- [ ] 6.3 Add a reply input field/modal for the admin to submit responses to reviews via the API.
