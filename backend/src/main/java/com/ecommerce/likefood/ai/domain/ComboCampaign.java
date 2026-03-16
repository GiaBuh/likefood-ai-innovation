package com.ecommerce.likefood.ai.domain;

import com.ecommerce.likefood.common.utils.BaseEntity;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "combo_campaigns")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComboCampaign extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String hashtag;

    @Column(nullable = false)
    private String comboName;

    private String slogan;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double discountPercentage;

    @Column(columnDefinition = "TEXT")
    private String imagePrompt;

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String items; // Legacy: JSON array of product names for backward compat

    @Column(nullable = false)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, APPROVED, PUBLISHED

    @Column(nullable = false)
    @Builder.Default
    private String source = "AI"; // AI or MANUAL

    @Column(precision = 15, scale = 2)
    private BigDecimal comboPrice;

    @OneToMany(mappedBy = "comboCampaign", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    @Builder.Default
    private List<ComboItem> comboItems = new ArrayList<>();
}
