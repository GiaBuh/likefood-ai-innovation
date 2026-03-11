package com.ecommerce.likefood.ai.repository;

import com.ecommerce.likefood.ai.domain.ComboCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComboCampaignRepository extends JpaRepository<ComboCampaign, String> {
}
