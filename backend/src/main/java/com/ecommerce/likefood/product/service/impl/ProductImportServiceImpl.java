package com.ecommerce.likefood.product.service.impl;

import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.product.domain.ProductStatus;
import com.ecommerce.likefood.product.dto.req.ProductCreateRequest;
import com.ecommerce.likefood.product.dto.req.ProductImportResult;
import com.ecommerce.likefood.product.dto.req.ProductVariantCreateRequest;
import com.ecommerce.likefood.product.dto.res.ProductResponse;
import com.ecommerce.likefood.product.repository.CategoryRepository;
import com.ecommerce.likefood.product.service.ProductImportService;
import com.ecommerce.likefood.product.service.ProductService;
import com.ecommerce.likefood.storage.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.StringReader;
import java.math.BigDecimal;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductImportServiceImpl implements ProductImportService {

    private static final String[] CSV_HEADERS = {
            "name", "description", "categoryId", "categoryName", "status", "slug",
            "weightValue", "weightUnit", "sku", "price", "quantity",
            "thumbnailUrl", "imageUrls"
    };

    private final ProductService productService;
    private final CategoryRepository categoryRepository;
    private final StorageService storageService;

    @Override
    public ProductImportResult importFromCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException("CSV file is required");
        }
        if (!file.getOriginalFilename().toLowerCase().endsWith(".csv")) {
            throw new AppException("File must be a CSV");
        }

        List<ProductResponse> created = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        byte[] bytes;
        try {
            bytes = file.getInputStream().readAllBytes();
        } catch (IOException e) {
            throw new AppException("Failed to read CSV file: " + e.getMessage());
        }
        Charset charset = detectCharset(bytes);
        String content = new String(bytes, charset);

        try (CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader(CSV_HEADERS)
                     .setSkipHeaderRecord(true)
                     .setTrim(true)
                     .build()
                     .parse(new StringReader(content))) {

            Map<String, List<CSVRecord>> grouped = new LinkedHashMap<>();
            for (CSVRecord record : parser) {
                String name = get(record, "name");
                if (name == null || name.isBlank()) continue;
                grouped.computeIfAbsent(name.trim(), k -> new ArrayList<>()).add(record);
            }

            for (Map.Entry<String, List<CSVRecord>> entry : grouped.entrySet()) {
                try {
                    ProductCreateRequest req = buildRequest(entry.getKey(), entry.getValue());
                    ProductResponse resp = productService.create(req);
                    created.add(resp);
                } catch (Exception e) {
                    log.warn("Import failed for product '{}': {}", entry.getKey(), e.getMessage());
                    errors.add(entry.getKey() + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            throw new AppException("Failed to parse CSV: " + e.getMessage());
        }

        int total = created.size() + errors.size();
        return ProductImportResult.builder()
                .totalRows(total)
                .successCount(created.size())
                .failCount(errors.size())
                .created(created)
                .errors(errors)
                .build();
    }

    private ProductCreateRequest buildRequest(String productName, List<CSVRecord> records) {
        CSVRecord first = records.get(0);
        String description = get(first, "description");
        String categoryId = resolveCategoryId(get(first, "categoryId"), get(first, "categoryName"));
        if (categoryId == null || categoryId.isBlank()) {
            throw new AppException("categoryId or categoryName is required");
        }
        String statusStr = get(first, "status");
        ProductStatus status = parseStatus(statusStr);
        String slug = get(first, "slug");

        String thumbnailUrl = get(first, "thumbnailUrl");
        String imageUrlsStr = get(first, "imageUrls");
        List<String> imageUrlList = parseList(imageUrlsStr);
        if ((thumbnailUrl == null || thumbnailUrl.isBlank()) && imageUrlList.isEmpty()) {
            throw new AppException("thumbnailUrl or imageUrls is required for images");
        }
        List<String> allUrls = new ArrayList<>();
        if (thumbnailUrl != null && !thumbnailUrl.isBlank()) allUrls.add(thumbnailUrl);
        allUrls.addAll(imageUrlList.stream().filter(u -> !u.equals(thumbnailUrl)).toList());

        String thumbnailKey;
        List<String> imageKeys = new ArrayList<>();
        try {
            if (!allUrls.isEmpty()) {
                thumbnailKey = storageService.uploadImageFromUrl(allUrls.get(0)).getKey();
                for (int i = 1; i < allUrls.size(); i++) {
                    try {
                        imageKeys.add(storageService.uploadImageFromUrl(allUrls.get(i)).getKey());
                    } catch (Exception e) {
                        log.warn("Skip image URL: {}", allUrls.get(i), e);
                    }
                }
            } else {
                throw new AppException("No valid image URL");
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException("Failed to upload image from URL: " + e.getMessage());
        }

        List<ProductVariantCreateRequest> variants = records.stream().map(r -> {
            ProductVariantCreateRequest v = new ProductVariantCreateRequest();
            v.setWeightValue(requireDecimal(get(r, "weightValue"), "weightValue"));
            v.setWeightUnit(require(get(r, "weightUnit"), "weightUnit"));
            v.setSku(require(get(r, "sku"), "sku"));
            v.setPrice(requireDecimal(get(r, "price"), "price"));
            v.setQuantity(requireInt(get(r, "quantity"), "quantity"));
            return v;
        }).collect(Collectors.toList());

        ProductCreateRequest req = new ProductCreateRequest();
        req.setName(productName);
        req.setDescription(description);
        req.setCategoryId(categoryId);
        req.setStatus(status);
        req.setSlug(slug);
        req.setThumbnailKey(thumbnailKey);
        req.setImageKeys(imageKeys);
        req.setVariants(variants);
        return req;
    }

    private String get(CSVRecord r, String header) {
        try {
            String v = r.get(header);
            return v == null ? null : v.trim();
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String require(String v, String name) {
        if (v == null || v.isBlank()) throw new AppException(name + " is required");
        return v;
    }

    private BigDecimal parseDecimal(String v) {
        if (v == null || v.isBlank()) return null;
        try {
            return new BigDecimal(v.trim());
        } catch (NumberFormatException e) {
            throw new AppException("Invalid number: " + v);
        }
    }

    private BigDecimal requireDecimal(String v, String name) {
        BigDecimal d = parseDecimal(v);
        if (d == null) throw new AppException(name + " is required");
        return d;
    }

    private Integer parseInt(String v) {
        if (v == null || v.isBlank()) return null;
        try {
            return Integer.parseInt(v.trim());
        } catch (NumberFormatException e) {
            throw new AppException("Invalid integer: " + v);
        }
    }

    private Integer requireInt(String v, String name) {
        Integer n = parseInt(v);
        if (n == null) throw new AppException(name + " is required");
        return n;
    }

    private ProductStatus parseStatus(String v) {
        if (v == null || v.isBlank()) return ProductStatus.ACTIVE;
        return switch (v.toUpperCase()) {
            case "INACTIVE" -> ProductStatus.INACTIVE;
            default -> ProductStatus.ACTIVE;
        };
    }

    private List<String> parseList(String v) {
        if (v == null || v.isBlank()) return List.of();
        return Arrays.stream(v.split("[;,]"))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }

    /**
     * Detects charset for Vietnamese CSV. UTF-8 first, then Windows-1258 (Vietnamese), then Windows-1252.
     */
    private Charset detectCharset(byte[] bytes) {
        String utf8 = new String(bytes, StandardCharsets.UTF_8);
        if (!utf8.contains("\uFFFD")) {
            return StandardCharsets.UTF_8;
        }
        try {
            String win1258 = new String(bytes, Charset.forName("Windows-1258"));
            if (!win1258.contains("\uFFFD")) {
                log.debug("CSV detected as Windows-1258 (Vietnamese)");
                return Charset.forName("Windows-1258");
            }
        } catch (Exception ignored) {
        }
        try {
            String win1252 = new String(bytes, Charset.forName("Windows-1252"));
            if (!win1252.contains("\uFFFD")) {
                log.debug("CSV fallback to Windows-1252");
                return Charset.forName("Windows-1252");
            }
        } catch (Exception ignored) {
        }
        log.warn("CSV encoding unclear, using UTF-8");
        return StandardCharsets.UTF_8;
    }

    private String resolveCategoryId(String categoryId, String categoryName) {
        if (categoryId != null && !categoryId.isBlank()) {
            return categoryRepository.findById(categoryId)
                    .map(c -> c.getId())
                    .orElseThrow(() -> new AppException("Category not found: " + categoryId));
        }
        if (categoryName != null && !categoryName.isBlank()) {
            return categoryRepository.findByName(categoryName.trim())
                    .map(c -> c.getId())
                    .orElseThrow(() -> new AppException("Category not found: " + categoryName));
        }
        return null;
    }
}
