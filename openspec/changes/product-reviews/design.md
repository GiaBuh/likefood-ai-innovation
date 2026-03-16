## Context

Currently, the LikeFood web application lacks a system for users to provide feedback on products they have purchased. To build trust and improve the shopping experience, we are introducing a comprehensive Product Review system. This system will allow verified buyers to leave ratings, comments, and media (images). Shop administrators will also be able to reply to these reviews.

## Goals / Non-Goals

**Goals:**
- Implement a 5-star rating system with text comments and image uploads.
- Restrict review creation strictly to users who have a completed order for that specific product.
- Allow shop administrators to reply to user reviews.
- Display aggregated ratings (average score and total count) on product listings and details pages.
- Provide a filtering mechanism on the product detail page to sort/filter reviews (e.g., by star rating, has media).

**Non-Goals:**
- Video upload support for reviews (initially restricting to Images only to reduce storage complexity).
- Upvoting/Downvoting of reviews by other users (helpful/not helpful).
- Complex review criteria sorting (e.g., rating specific attributes like "quality", "shipping" separately).

## Decisions

- **Database Schema (`reviews` table):** Create a new `reviews` table linking `user_id` and `product_id` with `order_id` to strictly enforce the "verified purchase" rule.
- **Media Storage (`review_images` table):** Instead of storing images directly in the review table as a JSON array, use a separate `review_images` table with a foreign key to the `review_id`. This allows for easier management, counting, and potential future expansion.
- **Shop Replies (`review_replies` or self-join):** To handle shop replies, we can either add a `reply_text` column to the `reviews` table (simplest for a 1-to-1 reply mapping) OR create a separate `review_replies` table. Decision: Add `reply_text` and `replied_at` directly to the `reviews` table for simplicity, as we only expect one official shop reply per review.
- **Rating Aggregation:** To avoid expensive SQL aggregation queries on every page load, we will add `average_rating` and `review_count` to the `products` table and update them asynchronously or via triggers whenever a new review is added or deleted.

## Risks / Trade-offs

- **Risk:** Spam or inappropriate content in text/images.
  - **Mitigation:** Limit reviews to verified buyers. Implement a 신고 (Report) feature in the future if necessary. Admin panel allows deletion of inappropriate reviews.
- **Risk:** High storage costs for uploaded images.
  - **Mitigation:** Implement strict image size limits (e.g., Max 5MB per image, Max 3 images per review) and compress images on the frontend/backend before saving.
- **Risk:** Performance degradation on Product Details page due to numerous reviews.
  - **Mitigation:** Implement pagination or "Load More" functionality for retrieving reviews. Limit the initial payload to the top 5-10 reviews.
