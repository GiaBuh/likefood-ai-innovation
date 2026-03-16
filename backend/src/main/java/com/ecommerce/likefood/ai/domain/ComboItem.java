package com.ecommerce.likefood.ai.domain;

import com.ecommerce.likefood.common.utils.BaseEntity;
import com.ecommerce.likefood.product.domain.Product;
import com.ecommerce.likefood.product.domain.ProductVariant;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "combo_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComboItem extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "combo_campaign_id", nullable = false)
    @JsonBackReference
    private ComboCampaign comboCampaign;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnoreProperties({"variants", "category", "reviews", "hibernateLazyInitializer", "handler"})
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    @JsonIgnoreProperties({"product", "hibernateLazyInitializer", "handler"})
    private ProductVariant variant;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;
}
