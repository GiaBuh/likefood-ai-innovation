package com.ecommerce.likefood.flashsale.repository;

import com.ecommerce.likefood.flashsale.domain.FlashSaleEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface FlashSaleEventRepository extends JpaRepository<FlashSaleEvent, String> {

    @Query("SELECT e FROM FlashSaleEvent e WHERE e.isActive = true AND e.startTime <= :now AND e.endTime >= :now ORDER BY e.startTime ASC")
    List<FlashSaleEvent> findActiveEvents(Instant now);

    @Query("SELECT e FROM FlashSaleEvent e WHERE e.isActive = true AND e.startTime <= :endOfDay AND e.endTime >= :startOfDay ORDER BY e.startTime ASC")
    List<FlashSaleEvent> findEventsForDay(Instant startOfDay, Instant endOfDay);

    List<FlashSaleEvent> findAllByOrderByStartTimeDesc();
}
