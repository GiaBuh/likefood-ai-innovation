package com.ecommerce.likefood.product.service;

import com.ecommerce.likefood.product.dto.req.ProductImportResult;
import org.springframework.web.multipart.MultipartFile;

public interface ProductImportService {
    ProductImportResult importFromCsv(MultipartFile file);
}
