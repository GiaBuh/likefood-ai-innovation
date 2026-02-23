package com.ecommerce.likefood.product.service;

import com.ecommerce.likefood.common.response.PaginationResponse;
import com.ecommerce.likefood.product.dto.req.ProductCreateRequest;
import com.ecommerce.likefood.product.dto.req.ProductSpecRequest;
import com.ecommerce.likefood.product.dto.res.ProductResponse;
import org.springframework.data.domain.Pageable;

public interface ProductService {
    ProductResponse create(ProductCreateRequest request);
    ProductResponse update(String id, ProductCreateRequest request);
    ProductResponse delete(String id);

    PaginationResponse getAll(ProductSpecRequest productSpecRequest, Pageable pageable);

    ProductResponse getById(String id);
}
