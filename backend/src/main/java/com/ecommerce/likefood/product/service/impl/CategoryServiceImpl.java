package com.ecommerce.likefood.product.service.impl;

import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.product.domain.Category;
import com.ecommerce.likefood.product.dto.req.CategoryCreateRequest;
import com.ecommerce.likefood.product.dto.req.CategoryUpdateRequest;
import com.ecommerce.likefood.product.dto.res.CategoryResponse;
import com.ecommerce.likefood.product.repository.CategoryRepository;
import com.ecommerce.likefood.product.repository.ProductRepository;
import com.ecommerce.likefood.product.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Override
    public CategoryResponse create(CategoryCreateRequest request) {
        if (categoryRepository.existsByName(request.getName().trim())) {
            throw new AppException("Category name already exists");
        }

        Category category = Category.builder()
                .name(request.getName().trim())
                .build();

        return toResponse(categoryRepository.save(category));
    }

    @Override
    public CategoryResponse update(String id, CategoryUpdateRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException("Category not found"));

        String newName = request.getName().trim();
        if (categoryRepository.existsByNameAndIdNot(newName, id)) {
            throw new AppException("Category name already exists");
        }

        category.setName(newName);
        return toResponse(categoryRepository.save(category));
    }

    @Override
    public void delete(String id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException("Category not found"));

        if (productRepository.existsByCategory_Id(id)) {
            throw new AppException("Cannot delete category: it has products. Move or delete products first.");
        }

        categoryRepository.delete(category);
    }

    @Override
    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll().stream().map(this::toResponse).toList();
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .icon(category.getIcon())
                .build();
    }
}
