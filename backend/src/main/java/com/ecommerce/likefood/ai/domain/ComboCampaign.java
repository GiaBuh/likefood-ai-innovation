package com.ecommerce.likefood.ai.domain;

import com.ecommerce.likefood.common.utils.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

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

    @Column(nullable = false)
    private String hashtag;

    @Column(nullable = false)
    private String comboName;

    @Column(nullable = false)
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
    private String items; // JSON array of product names, e.g. ["Bún chả", "Phở Bò"]

    @Column(nullable = false)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, APPROVED, PUBLISHED
}
