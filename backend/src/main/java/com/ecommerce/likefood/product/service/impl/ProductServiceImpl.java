package com.ecommerce.likefood.product.service.impl;

import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.common.response.PaginationResponse;
import com.ecommerce.likefood.common.specification.GenericSpecification;
import com.ecommerce.likefood.product.domain.Category;
import jakarta.persistence.criteria.Predicate;
import com.ecommerce.likefood.product.domain.Product;
import com.ecommerce.likefood.product.domain.ProductImage;
import com.ecommerce.likefood.product.domain.ProductStatus;
import com.ecommerce.likefood.product.domain.ProductVariant;
import com.ecommerce.likefood.product.dto.req.ProductCreateRequest;
import com.ecommerce.likefood.product.dto.req.ProductSpecRequest;
import com.ecommerce.likefood.product.dto.res.ProductResponse;
import com.ecommerce.likefood.product.dto.res.ProductVariantResponse;
import com.ecommerce.likefood.product.mapper.ProductMapper;
import com.ecommerce.likefood.cart.repository.CartItemRepository;
import com.ecommerce.likefood.order.repository.OrderItemRepository;
import com.ecommerce.likefood.product.repository.CategoryRepository;
import com.ecommerce.likefood.product.repository.ProductRepository;
import com.ecommerce.likefood.product.repository.ProductVariantRepository;
import com.ecommerce.likefood.product.service.ProductService;
import com.ecommerce.likefood.review.repository.ReviewRepository;
import com.ecommerce.likefood.flashsale.domain.FlashSaleEvent;
import com.ecommerce.likefood.flashsale.domain.FlashSaleItem;
import com.ecommerce.likefood.flashsale.repository.FlashSaleEventRepository;
import com.ecommerce.likefood.flashsale.repository.FlashSaleItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderItemRepository orderItemRepository;
    private final ReviewRepository reviewRepository;
    private final FlashSaleEventRepository flashSaleEventRepository;
    private final FlashSaleItemRepository flashSaleItemRepository;
    private final ProductMapper productMapper;

    @Override
    public ProductResponse create(ProductCreateRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException("Category not found"));

        Product product = Product.builder()
                .name(request.getName())
                .slug(request.getSlug() == null || request.getSlug().isBlank() ? toSlug(request.getName()) : request.getSlug())
                .status(request.getStatus() == null ? ProductStatus.ACTIVE : request.getStatus())
                .description(request.getDescription())
                .thumbnailKey(request.getThumbnailKey())
                .category(category)
                .build();

        product.getVariants().addAll(mapVariantsForCreate(request.getVariants(), product));
        product.getImages().addAll(mapImages(request.getThumbnailKey(), request.getImageKeys(), product));

        Product saved = productRepository.save(product);
        return toResponseWithSoldCount(saved);
    }

    @Override
    public ProductResponse update(String id, ProductCreateRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException("Product not found"));
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException("Category not found"));

        product.setName(request.getName());
        product.setSlug(request.getSlug() == null || request.getSlug().isBlank() ? toSlug(request.getName()) : request.getSlug());
        product.setStatus(request.getStatus() == null ? ProductStatus.ACTIVE : request.getStatus());
        product.setDescription(request.getDescription());
        product.setThumbnailKey(request.getThumbnailKey());
        product.setCategory(category);

        // Update variants in place - avoid deleting variants that are in cart (FK constraint)
        List<ProductVariant> existingVariants = new ArrayList<>(product.getVariants());
        List<ProductVariant> toKeep = new ArrayList<>();
        for (com.ecommerce.likefood.product.dto.req.ProductVariantCreateRequest req : request.getVariants()) {
            ProductVariant existing = req.getId() != null && !req.getId().isBlank()
                    ? existingVariants.stream().filter(v -> v.getId().equals(req.getId())).findFirst().orElse(null)
                    : existingVariants.stream().filter(v -> v.getSku().equals(req.getSku())).findFirst().orElse(null);
            if (existing != null) {
                if (!req.getSku().equals(existing.getSku()) && productVariantRepository.existsBySku(req.getSku())) {
                    throw new AppException("Variant SKU already exists: " + req.getSku());
                }
                existing.setWeightValue(req.getWeightValue());
                existing.setWeightUnit(req.getWeightUnit());
                existing.setSku(req.getSku());
                existing.setPrice(req.getPrice());
                existing.setQuantity(req.getQuantity());
                existing.setBestSeller(req.getBestSeller() != null && req.getBestSeller());
                toKeep.add(existing);
            } else {
                if (productVariantRepository.existsBySku(req.getSku())) {
                    throw new AppException("Variant SKU already exists: " + req.getSku());
                }
                toKeep.add(ProductVariant.builder()
                        .product(product)
                        .weightValue(req.getWeightValue())
                        .weightUnit(req.getWeightUnit())
                        .sku(req.getSku())
                        .price(req.getPrice())
                        .quantity(req.getQuantity())
                        .bestSeller(req.getBestSeller() != null && req.getBestSeller())
                        .build());
            }
        }
        Set<String> keptIds = new HashSet<>();
        for (ProductVariant v : toKeep) {
            if (v.getId() != null) keptIds.add(v.getId());
        }
        for (ProductVariant old : existingVariants) {
            if (!keptIds.contains(old.getId())) {
                if (cartItemRepository.existsByVariant_Id(old.getId())) {
                    throw new AppException("Cannot remove variant " + old.getSku() + " - it is in customer carts.");
                }
                product.getVariants().remove(old);
                productVariantRepository.delete(old);
            }
        }
        product.getVariants().clear();
        product.getVariants().addAll(toKeep);
        productVariantRepository.flush();

        product.getImages().clear();
        product.getImages().addAll(mapImages(request.getThumbnailKey(), request.getImageKeys(), product));

        Product saved = productRepository.save(product);
        return toResponseWithSoldCount(saved);
    }

    @Override
    public ProductResponse delete(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException("Product not found"));

        // Soft delete: set status to INACTIVE (product remains in DB, hidden from shop)
        product.setStatus(ProductStatus.INACTIVE);
        return toResponseWithSoldCount(productRepository.save(product));
    }

    @Override
    public PaginationResponse getAll(ProductSpecRequest productSpecRequest, Pageable pageable) {
        ProductSpecRequest requestForSpec = productSpecRequest;
        if (productSpecRequest.getSearch() != null && !productSpecRequest.getSearch().isBlank()) {
            requestForSpec = new ProductSpecRequest();
            requestForSpec.setCategoryName(productSpecRequest.getCategoryName());
            requestForSpec.setStatus(productSpecRequest.getStatus());
            requestForSpec.setMinPrice(productSpecRequest.getMinPrice());
            requestForSpec.setMaxPrice(productSpecRequest.getMaxPrice());
            requestForSpec.setBestSeller(productSpecRequest.getBestSeller());
        }
        Specification<Product> spec = GenericSpecification.filter(requestForSpec);
        if (productSpecRequest.getSearch() != null && !productSpecRequest.getSearch().isBlank()) {
            String searchTerm = productSpecRequest.getSearch().trim().toLowerCase();
            Specification<Product> searchSpec = (root, query, builder) -> {
                Predicate nameLike = builder.like(
                    builder.lower(root.get("name")), "%" + searchTerm + "%");
                Predicate categoryLike = builder.like(
                    builder.lower(root.get("category").get("name")), "%" + searchTerm + "%");
                return builder.or(nameLike, categoryLike);
            };
            spec = spec.and(searchSpec);
        }
        Page<Product> page = productRepository.findAll(spec, pageable);

        // Batch load soldCounts for all variants in the page
        Map<String, Long> soldCountMap = buildSoldCountMap();
        Map<String, FlashSaleItem> flashSaleMap = buildActiveFlashSaleMap();

        PaginationResponse.Meta meta = PaginationResponse.Meta.builder()
                .page(page.getNumber() + 1)
                .pageSize(page.getSize())
                .totalPages(page.getTotalPages())
                .total(page.getTotalElements())
                .build();

        List<ProductResponse> result = page.getContent().stream()
                .map(p -> toResponseWithSoldCount(p, soldCountMap, flashSaleMap))
                .toList();

        return PaginationResponse.builder()
                .meta(meta)
                .result(result)
                .build();
    }

    @Override
    public PaginationResponse getSuggestions(String userEmail, Pageable pageable) {
        Page<Product> page;

        if (userEmail != null && !userEmail.isBlank()) {
            List<String> categoryIds = orderItemRepository.findCategoryIdsByUserEmail(userEmail);
            if (!categoryIds.isEmpty()) {
                // User has purchase history → prioritize products from those categories
                page = productRepository.findByStatusAndCategory_IdIn(ProductStatus.ACTIVE, categoryIds, pageable);
            } else {
                // User has no orders → random active products
                page = productRepository.findByStatus(ProductStatus.ACTIVE, pageable);
            }
        } else {
            // Anonymous user → random active products
            page = productRepository.findByStatus(ProductStatus.ACTIVE, pageable);
        }

        Map<String, Long> soldCountMap = buildSoldCountMap();
        Map<String, FlashSaleItem> flashSaleMap = buildActiveFlashSaleMap();

        PaginationResponse.Meta meta = PaginationResponse.Meta.builder()
                .page(page.getNumber() + 1)
                .pageSize(page.getSize())
                .totalPages(page.getTotalPages())
                .total(page.getTotalElements())
                .build();

        List<ProductResponse> result = page.getContent().stream()
                .map(p -> toResponseWithSoldCount(p, soldCountMap, flashSaleMap))
                .toList();

        return PaginationResponse.builder()
                .meta(meta)
                .result(result)
                .build();
    }

    @Override
    public ProductResponse getById(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException("Product not found"));
        return toResponseWithSoldCount(product);
    }

    @Override
    public ProductResponse getBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new AppException("Product not found"));
        return toResponseWithSoldCount(product);
    }

    // ─── Sold Count Helpers ──────────────────────────────────────

    /**
     * Build a map of variantId → soldCount from all COMPLETED orders.
     */
    private Map<String, Long> buildSoldCountMap() {
        Map<String, Long> map = new HashMap<>();
        for (Object[] row : orderItemRepository.findSoldCountByVariant()) {
            map.put((String) row[0], ((Number) row[1]).longValue());
        }
        return map;
    }

    private Map<String, FlashSaleItem> buildActiveFlashSaleMap() {
        Map<String, FlashSaleItem> flashSaleMap = new HashMap<>();
        List<FlashSaleEvent> activeEvents = flashSaleEventRepository.findActiveEvents(Instant.now());
        if (!activeEvents.isEmpty()) {
            List<FlashSaleItem> activeItems = flashSaleItemRepository.findByFlashSaleEventIn(activeEvents);
            for (FlashSaleItem item : activeItems) {
                if (item.getVariantId() != null && !item.getVariantId().isBlank()) {
                    flashSaleMap.put(item.getVariantId(), item);
                } else {
                    flashSaleMap.put("product-" + item.getProduct().getId(), item);
                }
            }
        }
        return flashSaleMap;
    }

    /**
     * Convert Product to ProductResponse with soldCount injected (single product, queries DB).
     */
    private ProductResponse toResponseWithSoldCount(Product product) {
        Map<String, Long> soldCountMap = new HashMap<>();
        for (Object[] row : orderItemRepository.findSoldCountByProductId(product.getId())) {
            soldCountMap.put((String) row[0], ((Number) row[1]).longValue());
        }
        Map<String, FlashSaleItem> flashSaleMap = buildActiveFlashSaleMap();
        return toResponseWithSoldCount(product, soldCountMap, flashSaleMap);
    }

    /**
     * Convert Product to ProductResponse with soldCount from pre-built map.
     */
    private ProductResponse toResponseWithSoldCount(Product product, Map<String, Long> soldCountMap, Map<String, FlashSaleItem> flashSaleMap) {
        ProductResponse response = productMapper.toResponse(product);

        // Inject soldCount into each variant, and apply flash sale override if any
        long totalSold = 0;
        FlashSaleItem productLevelSale = flashSaleMap.get("product-" + product.getId());
        for (ProductVariantResponse vr : response.getVariants()) {
            long sold = soldCountMap.getOrDefault(vr.getId(), 0L);
            vr.setSoldCount(sold);
            totalSold += sold;

            FlashSaleItem fsItem = flashSaleMap.containsKey(vr.getId()) ? flashSaleMap.get(vr.getId()) : productLevelSale;
            if (fsItem != null) {
                vr.setOriginalPrice(vr.getPrice());
                vr.setPrice(fsItem.getSalePrice());
                if (vr.getOriginalPrice() != null && vr.getOriginalPrice().compareTo(BigDecimal.ZERO) > 0) {
                    int percent = BigDecimal.valueOf(100).subtract(
                        fsItem.getSalePrice().multiply(BigDecimal.valueOf(100)).divide(vr.getOriginalPrice(), java.math.RoundingMode.HALF_UP)
                    ).intValue();
                    vr.setDiscountPercent(percent);
                }
            }
        }
        response.setTotalSoldCount(totalSold);

        // Inject review stats
        Double avgRating = reviewRepository.getAverageRatingByProductId(product.getId());
        long totalReviews = reviewRepository.countByProduct_Id(product.getId());
        if (avgRating != null) {
            response.setAverageRating(Math.round(avgRating * 10.0) / 10.0);
        }
        response.setTotalReviews(totalReviews);

        return response;
    }

    // ─── Variant Mapping ─────────────────────────────────────────

    private List<ProductVariant> mapVariantsForCreate(List<com.ecommerce.likefood.product.dto.req.ProductVariantCreateRequest> variantRequests, Product product) {
        return variantRequests.stream()
                .peek(variantRequest -> {
                    if (productVariantRepository.existsBySku(variantRequest.getSku())) {
                        throw new AppException("Variant SKU already exists: " + variantRequest.getSku());
                    }
                })
                .map(variantRequest -> ProductVariant.builder()
                        .product(product)
                        .weightValue(variantRequest.getWeightValue())
                        .weightUnit(variantRequest.getWeightUnit())
                        .sku(variantRequest.getSku())
                        .price(variantRequest.getPrice())
                        .quantity(variantRequest.getQuantity())
                        .bestSeller(variantRequest.getBestSeller() != null && variantRequest.getBestSeller())
                        .build())
                .toList();
    }

    private List<ProductImage> mapImages(String thumbnailKey, List<String> imageKeys, Product product) {
        return IntStream.range(0, imageKeys.size())
                .mapToObj(index -> {
                    String key = imageKeys.get(index);
                    if (key == null || key.isBlank()) {
                        return null;
                    }
                    String normalizedThumbnail = thumbnailKey == null ? "" : thumbnailKey.trim();
                    String normalizedKey = key.trim();
                    if (!normalizedThumbnail.isEmpty() && normalizedThumbnail.equals(normalizedKey)) {
                        return null;
                    }
                    return ProductImage.builder()
                            .product(product)
                            .imageKey(normalizedKey)
                            .sortOrder(index + 1)
                            .build();
                })
                .filter(Objects::nonNull)
                .toList();
    }

    /**
     * Convert string to URL-friendly slug. Handles Vietnamese by transliterating
     * accents to ASCII (ế→e, ư→u, đ→d, etc.) so slugs remain readable.
     */
    private String toSlug(String input) {
        if (input == null || input.isBlank()) return "";
        // Normalize Vietnamese: đ/Đ → d
        String s = input.replace("đ", "d").replace("Đ", "d");
        // NFD: ế → e + ̂, ư → u + ̛; remove combining marks
        s = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return s.toLowerCase()
                .trim()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")  // collapse multiple hyphens
                .replaceAll("^-|-$", "");  // trim leading/trailing hyphens
    }
}
