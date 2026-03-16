package com.ecommerce.likefood.voucher.service;

import com.ecommerce.likefood.user.domain.User;
import com.ecommerce.likefood.voucher.dto.req.VoucherRequest;
import com.ecommerce.likefood.voucher.dto.res.UserVoucherResponse;
import com.ecommerce.likefood.voucher.dto.res.VoucherResponse;

import java.util.List;

public interface VoucherService {
    VoucherResponse createVoucher(VoucherRequest request);
    List<VoucherResponse> getActiveVouchers();
    List<VoucherResponse> getAllVouchers();
    VoucherResponse updateVoucher(String id, VoucherRequest request);
    void deleteVoucher(String id);
    List<UserVoucherResponse> getMyVouchers();
    UserVoucherResponse claimVoucher(String voucherId);
    void assignWelcomeVouchers(User user);
}
