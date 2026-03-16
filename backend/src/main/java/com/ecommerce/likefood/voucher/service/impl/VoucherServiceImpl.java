package com.ecommerce.likefood.voucher.service.impl;

import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.common.security.SecurityUtils;
import com.ecommerce.likefood.user.domain.User;
import com.ecommerce.likefood.user.repository.UserRepository;
import com.ecommerce.likefood.voucher.domain.UserVoucher;
import com.ecommerce.likefood.voucher.domain.UserVoucherStatus;
import com.ecommerce.likefood.voucher.domain.Voucher;
import com.ecommerce.likefood.voucher.dto.req.VoucherRequest;
import com.ecommerce.likefood.voucher.dto.res.UserVoucherResponse;
import com.ecommerce.likefood.voucher.dto.res.VoucherResponse;
import com.ecommerce.likefood.voucher.mapper.VoucherMapper;
import com.ecommerce.likefood.voucher.repository.UserVoucherRepository;
import com.ecommerce.likefood.voucher.repository.VoucherRepository;
import com.ecommerce.likefood.voucher.service.VoucherService;
import lombok.RequiredArgsConstructor;
import com.ecommerce.likefood.order.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final VoucherMapper voucherMapper;

    @Override
    @Transactional
    public VoucherResponse createVoucher(VoucherRequest request) {
        if (voucherRepository.findByCode(request.getCode()).isPresent()) {
            throw new AppException("Voucher code already exists");
        }
        Voucher voucher = voucherMapper.toEntity(request);
        return voucherMapper.toResponse(voucherRepository.save(voucher));
    }

    @Override
    @Transactional(readOnly = true)
    public List<VoucherResponse> getActiveVouchers() {
        return voucherRepository.findActiveVouchers(Instant.now())
                .stream()
                .map(voucherMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VoucherResponse> getAllVouchers() {
        return voucherRepository.findAll()
                .stream()
                .map(voucherMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public VoucherResponse updateVoucher(String id, VoucherRequest request) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new AppException("Voucher not found"));

        if (!voucher.getCode().equals(request.getCode()) && voucherRepository.findByCode(request.getCode()).isPresent()) {
            throw new AppException("Voucher code already exists");
        }

        voucher.setCode(request.getCode());
        voucher.setType(request.getType());
        voucher.setDiscountType(request.getDiscountType());
        voucher.setDiscountValue(request.getDiscountValue());
        voucher.setMaxDiscountAmount(request.getMaxDiscountAmount());
        voucher.setMinOrderValue(request.getMinOrderValue());
        voucher.setUsageLimit(request.getUsageLimit());
        voucher.setStartTime(request.getStartTime());
        voucher.setEndTime(request.getEndTime());
        voucher.setIsActive(request.getIsActive());

        return voucherMapper.toResponse(voucherRepository.save(voucher));
    }

    @Override
    @Transactional
    public void deleteVoucher(String id) {
        if (!voucherRepository.existsById(id)) {
            throw new AppException("Voucher not found");
        }

        // Check if voucher is used in any orders
        boolean usedInShopVouchers = orderRepository.existsByShopVoucher_Id(id);
        boolean usedInShippingVouchers = orderRepository.existsByShippingVoucher_Id(id);

        if (usedInShopVouchers || usedInShippingVouchers) {
            throw new AppException("Voucher cannot be deleted because it is already associated with existing orders. Please set it to inactive instead.");
        }

        // Remove the voucher from user wallets first to avoid structural FK constraints
        userVoucherRepository.deleteByVoucher_Id(id);

        // Finally, delete the global voucher
        voucherRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserVoucherResponse> getMyVouchers() {
        String userEmail = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new AppException("User not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException("User not found"));
        
        return userVoucherRepository.findByUserId(user.getId())
                .stream()
                .map(voucherMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserVoucherResponse claimVoucher(String voucherId) {
        String userEmail = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new AppException("User not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException("User not found"));

        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new AppException("Voucher not found"));

        if (!voucher.getIsActive() || 
            (voucher.getStartTime() != null && voucher.getStartTime().isAfter(Instant.now())) ||
            (voucher.getEndTime() != null && voucher.getEndTime().isBefore(Instant.now())) ||
            voucher.getUsageCount() >= voucher.getUsageLimit()) {
            throw new AppException("Voucher is not available");
        }

        if (userVoucherRepository.existsByUserIdAndVoucherId(user.getId(), voucher.getId())) {
            throw new AppException("You have already claimed this voucher");
        }

        UserVoucher userVoucher = UserVoucher.builder()
                .user(user)
                .voucher(voucher)
                .status(UserVoucherStatus.SAVED)
                .collectedAt(Instant.now())
                .build();

        return voucherMapper.toResponse(userVoucherRepository.save(userVoucher));
    }

    @Override
    @Transactional
    public void assignWelcomeVouchers(User user) {
        List<Voucher> welcomeVouchers = voucherRepository.findByTags("WELCOME", null);
        
        for (Voucher voucher : welcomeVouchers) {
            if (!userVoucherRepository.existsByUserIdAndVoucherId(user.getId(), voucher.getId()) && voucher.getIsActive()) {
                UserVoucher userVoucher = UserVoucher.builder()
                        .user(user)
                        .voucher(voucher)
                        .status(UserVoucherStatus.SAVED)
                        .collectedAt(Instant.now())
                        .build();
                userVoucherRepository.save(userVoucher);
            }
        }
    }
}
