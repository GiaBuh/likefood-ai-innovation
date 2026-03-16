package com.ecommerce.likefood.voucher.dto.req;

import com.ecommerce.likefood.voucher.domain.DiscountType;
import com.ecommerce.likefood.voucher.domain.VoucherType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherRequest {
    private String code;
    private VoucherType type;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderValue;
    private Integer usageLimit;
    private Instant startTime;
    private Instant endTime;
    private Boolean isActive;
}
