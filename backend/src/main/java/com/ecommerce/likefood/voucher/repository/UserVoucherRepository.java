package com.ecommerce.likefood.voucher.repository;

import com.ecommerce.likefood.voucher.domain.UserVoucher;
import com.ecommerce.likefood.voucher.domain.UserVoucherStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserVoucherRepository extends JpaRepository<UserVoucher, String> {
    List<UserVoucher> findByUserId(String userId);

    List<UserVoucher> findByUserIdAndStatus(String userId, UserVoucherStatus status);

    boolean existsByUserIdAndVoucherId(String userId, String voucherId);

    void deleteByVoucher_Id(String voucherId);

    Optional<UserVoucher> findByIdAndUserId(String id, String userId);
}
