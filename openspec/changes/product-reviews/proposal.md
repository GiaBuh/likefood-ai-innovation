## Why

Currently, customers cannot share their feedback or experiences after purchasing products. Adding a Product Review feature (similar to Shopee) will significantly increase trust, provide valuable social proof for future buyers, and allow the shop to engage directly with customers through feedback replies.

## What Changes

- **Add Product Reviews Section:** A new section on the Product Details page displaying customer reviews, ratings (1 to 5 stars), and uploaded media (images/videos).
- **Filter Reviews:** Ability to filter reviews by star rating or by the presence of media (comments/images).
- **Review Submission:** Add functionality for customers to submit reviews, including star ratings, text comments, and media uploads.
- **Purchase Validation:** STRICTLY ENFORCE that only users who have successfully purchased and received the product (Status: DELIVERED/COMPLETED) can leave a review.
- **Shop Feedback (Reply):** Add functionality for shop administrators to reply to customer reviews, displayed directly below the original review.
- **Review Aggregation:** Calculate and display the average star rating and total number of reviews for each product.

## Capabilities

### New Capabilities
- `product-reviews`: Core functionality for creating, filtering, and displaying product reviews and ratings, including media uploads and purchase validation.
- `review-replies`: Functionality for shop administrators to reply to customer reviews.

### Modified Capabilities
- `product-detail`: Modified to include the aggregated rating display and the reviews section.

## Impact

- **Database:** New tables required for `reviews`, `review_images` (or media), and potentially `review_replies`. Product tables may need aggregated rating fields.
- **Backend API:** New endpoints for submitting reviews, fetching/filtering reviews, uploading review media, and submitting shop replies.
- **Frontend (Shop):** Significant additions to `ProductDetail.tsx` (or new components) for the review UI, statistics, and submission forms.
- **Frontend (Admin):** New UI in the admin panel to manage reviews and submit replies.
- **Storage:** Increased storage requirements for user-uploaded review images.
