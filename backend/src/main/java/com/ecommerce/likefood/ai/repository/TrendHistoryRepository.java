package com.ecommerce.likefood.ai.repository;

import com.ecommerce.likefood.ai.domain.TrendHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TrendHistoryRepository extends JpaRepository<TrendHistory, String> {
    List<TrendHistory> findTop30ByOrderByCreatedAtDesc();
}
