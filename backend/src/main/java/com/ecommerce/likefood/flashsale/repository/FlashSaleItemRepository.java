package com.ecommerce.likefood.flashsale.repository;

import com.ecommerce.likefood.flashsale.domain.FlashSaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FlashSaleItemRepository extends JpaRepository<FlashSaleItem, String> {
}
