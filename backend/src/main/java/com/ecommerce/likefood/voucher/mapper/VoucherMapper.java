package com.ecommerce.likefood.voucher.mapper;

import com.ecommerce.likefood.voucher.domain.UserVoucher;
import com.ecommerce.likefood.voucher.domain.Voucher;
import com.ecommerce.likefood.voucher.dto.req.VoucherRequest;
import com.ecommerce.likefood.voucher.dto.res.UserVoucherResponse;
import com.ecommerce.likefood.voucher.dto.res.VoucherResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface VoucherMapper {
    Voucher toEntity(VoucherRequest request);
    VoucherResponse toResponse(Voucher voucher);
    UserVoucherResponse toResponse(UserVoucher userVoucher);
}
