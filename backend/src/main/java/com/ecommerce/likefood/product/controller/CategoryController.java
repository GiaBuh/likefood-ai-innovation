package com.ecommerce.likefood.product.controller;

import com.ecommerce.likefood.common.utils.ApiMessage;
import com.ecommerce.likefood.product.dto.req.CategoryCreateRequest;
import com.ecommerce.likefood.product.dto.req.CategoryUpdateRequest;
import com.ecommerce.likefood.product.dto.res.CategoryResponse;
import com.ecommerce.likefood.product.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping("/categories")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Create category")
    public ResponseEntity<CategoryResponse> create(@RequestBody @Valid CategoryCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(request));
    }

    @PutMapping("/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Update category")
    public ResponseEntity<CategoryResponse> update(@PathVariable String id, @RequestBody @Valid CategoryUpdateRequest request) {
        return ResponseEntity.ok(categoryService.update(id, request));
    }

    @DeleteMapping("/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Delete category")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categories")
    @ApiMessage("Get categories")
    public ResponseEntity<List<CategoryResponse>> getAll() {
        return ResponseEntity.ok(categoryService.getAll());
    }
}
