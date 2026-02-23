package com.ecommerce.likefood.product.dto.req;

import com.ecommerce.likefood.product.dto.res.ProductResponse;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
public class ProductImportResult {
    private int totalRows;
    private int successCount;
    private int failCount;
    @Builder.Default
    private List<ProductResponse> created = new ArrayList<>();
    @Builder.Default
    private List<String> errors = new ArrayList<>();
}
