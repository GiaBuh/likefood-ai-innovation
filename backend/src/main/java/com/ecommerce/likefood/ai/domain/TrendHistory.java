package com.ecommerce.likefood.ai.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "trend_history")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(columnDefinition = "TEXT")
    private String topHashtags;

    @Column(columnDefinition = "TEXT")
    private String aiAnalysis;

    @Column(columnDefinition = "LONGTEXT")
    private String recommendedProductsJson;

    private String source;

    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
    }
}
