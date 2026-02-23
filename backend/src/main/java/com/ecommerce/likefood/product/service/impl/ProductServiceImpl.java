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
import com.ecommerce.likefood.product.mapper.ProductMapper;
import com.ecommerce.likefood.cart.repository.CartItemRepository;
import com.ecommerce.likefood.product.repository.CategoryRepository;
import com.ecommerce.likefood.product.repository.ProductRepository;
import com.ecommerce.likefood.product.repository.ProductVariantRepository;
import com.ecommerce.likefood.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
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

        return productMapper.toResponse(productRepository.save(product));
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

        return productMapper.toResponse(productRepository.save(product));
    }

    @Override
    public ProductResponse delete(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException("Product not found"));

        // Soft delete: set status to INACTIVE (product remains in DB, hidden from shop)
        product.setStatus(ProductStatus.INACTIVE);
        return productMapper.toResponse(productRepository.save(product));
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

        PaginationResponse.Meta meta = PaginationResponse.Meta.builder()
                .page(page.getNumber() + 1)
                .pageSize(page.getSize())
                .totalPages(page.getTotalPages())
                .total(page.getTotalElements())
                .build();

        List<ProductResponse> result = page.getContent().stream().map(productMapper::toResponse).toList();

        return PaginationResponse.builder()
                .meta(meta)
                .result(result)
                .build();
    }

    @Override
    public ProductResponse getById(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException("Product not found"));
        return productMapper.toResponse(product);
    }

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
        // NFD分解: ế → e + ̂, ư → u + ̛; remove combining marks
        s = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return s.toLowerCase()
                .trim()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")  // collapse multiple hyphens
                .replaceAll("^-|-$", "");  // trim leading/trailing hyphens
    }
}
