package com.ecommerce.likefood.product.service;

import com.ecommerce.likefood.product.dto.req.CategoryCreateRequest;
import com.ecommerce.likefood.product.dto.req.CategoryUpdateRequest;
import com.ecommerce.likefood.product.dto.res.CategoryResponse;

import java.util.List;

public interface CategoryService {
    CategoryResponse create(CategoryCreateRequest request);

    CategoryResponse update(String id, CategoryUpdateRequest request);

    void delete(String id);

    List<CategoryResponse> getAll();
}
