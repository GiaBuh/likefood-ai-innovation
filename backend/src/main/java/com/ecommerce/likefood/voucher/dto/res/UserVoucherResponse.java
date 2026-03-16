package com.ecommerce.likefood.voucher.dto.res;

import com.ecommerce.likefood.voucher.domain.UserVoucherStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class UserVoucherResponse {
    private String id;
    private String userId;
    private VoucherResponse voucher;
    private UserVoucherStatus status;
    private Instant collectedAt;
    private Instant usedAt;
}
