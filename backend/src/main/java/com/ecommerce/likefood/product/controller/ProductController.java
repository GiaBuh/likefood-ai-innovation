package com.ecommerce.likefood.product.controller;

import com.ecommerce.likefood.common.response.PaginationResponse;
import com.ecommerce.likefood.common.utils.ApiMessage;
import com.ecommerce.likefood.product.dto.req.ProductCreateRequest;
import com.ecommerce.likefood.product.dto.req.ProductImportResult;
import com.ecommerce.likefood.product.dto.req.ProductSpecRequest;
import com.ecommerce.likefood.product.dto.res.ProductResponse;
import com.ecommerce.likefood.product.service.ProductImportService;
import com.ecommerce.likefood.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final ProductImportService productImportService;

    @PostMapping("/products")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Create product")
    public ResponseEntity<ProductResponse> create(@RequestBody @Valid ProductCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(request));
    }

    @PutMapping("/products/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Update product")
    public ResponseEntity<ProductResponse> update(@PathVariable("id") String id, @RequestBody @Valid ProductCreateRequest request) {
        return ResponseEntity.ok(productService.update(id, request));
    }

    @DeleteMapping("/products/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Delete product")
    public ResponseEntity<ProductResponse> delete(@PathVariable("id") String id) {
        return ResponseEntity.ok(productService.delete(id));
    }

    @GetMapping("/products")
    @ApiMessage("Get products")
    public ResponseEntity<PaginationResponse> getAll(
            @ModelAttribute ProductSpecRequest productSpecRequest,
            Pageable pageable
    ) {
        return ResponseEntity.ok(productService.getAll(productSpecRequest, pageable));
    }

    @GetMapping("/products/{id}")
    @ApiMessage("Get product by ID")
    public ResponseEntity<ProductResponse> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @PostMapping(value = "/products/import", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Import products from CSV")
    public ResponseEntity<ProductImportResult> importFromCsv(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(productImportService.importFromCsv(file));
    }
}
