package com.ecommerce.likefood.voucher.repository;

import com.ecommerce.likefood.voucher.domain.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, String> {
    Optional<Voucher> findByCode(String code);

    @Query("SELECT v FROM Voucher v WHERE v.isActive = true AND (v.startTime IS NULL OR v.startTime <= :now) AND (v.endTime IS NULL OR v.endTime >= :now) AND v.usageCount < v.usageLimit")
    List<Voucher> findActiveVouchers(Instant now);

    @Query("SELECT v FROM Voucher v WHERE v.code LIKE %:prefix% OR v.id IN :ids")
    List<Voucher> findByTags(String prefix, List<String> ids); // Helper for welcome tagged vouchers, simplified
}
