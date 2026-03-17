package com.ecommerce.likefood.voucher.controller;

import com.ecommerce.likefood.common.utils.ApiMessage;
import com.ecommerce.likefood.voucher.dto.req.VoucherRequest;
import com.ecommerce.likefood.voucher.dto.res.UserVoucherResponse;
import com.ecommerce.likefood.voucher.dto.res.VoucherResponse;
import com.ecommerce.likefood.voucher.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    @PostMapping
    @PreAuthorize("hasPermission(null, 'VOUCHERS', 'CREATE')")
    @ApiMessage("Created voucher successfully")
    public ResponseEntity<VoucherResponse> createVoucher(@RequestBody VoucherRequest request) {
        return ResponseEntity.ok(voucherService.createVoucher(request));
    }

    @GetMapping("/active")
    @ApiMessage("Fetched active vouchers successfully")
    public ResponseEntity<List<VoucherResponse>> getActiveVouchers() {
        return ResponseEntity.ok(voucherService.getActiveVouchers());
    }

    @GetMapping
    @PreAuthorize("hasPermission(null, 'VOUCHERS', 'VIEW')")
    @ApiMessage("Fetched all vouchers successfully")
    public ResponseEntity<List<VoucherResponse>> getAllVouchers() {
        return ResponseEntity.ok(voucherService.getAllVouchers());
    }

    @GetMapping("/me")
    @ApiMessage("Fetched my vouchers successfully")
    public ResponseEntity<List<UserVoucherResponse>> getMyVouchers() {
        return ResponseEntity.ok(voucherService.getMyVouchers());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'VOUCHERS', 'EDIT')")
    @ApiMessage("Updated voucher successfully")
    public ResponseEntity<VoucherResponse> updateVoucher(@PathVariable String id, @RequestBody VoucherRequest request) {
        return ResponseEntity.ok(voucherService.updateVoucher(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'VOUCHERS', 'DELETE')")
    @ApiMessage("Deleted voucher successfully")
    public ResponseEntity<Void> deleteVoucher(@PathVariable String id) {
        voucherService.deleteVoucher(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/claim/{voucherId}")
    @ApiMessage("Claimed voucher successfully")
    public ResponseEntity<UserVoucherResponse> claimVoucher(@PathVariable String voucherId) {
        return ResponseEntity.ok(voucherService.claimVoucher(voucherId));
    }
}
