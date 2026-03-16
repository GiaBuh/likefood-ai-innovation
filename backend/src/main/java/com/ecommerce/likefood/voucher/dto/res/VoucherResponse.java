package com.ecommerce.likefood.voucher.dto.res;

import com.ecommerce.likefood.voucher.domain.DiscountType;
import com.ecommerce.likefood.voucher.domain.VoucherType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class VoucherResponse {
    private String id;
    private String code;
    private VoucherType type;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderValue;
    private Integer usageLimit;
    private Integer usageCount;
    private Instant startTime;
    private Instant endTime;
    private Boolean isActive;
}
