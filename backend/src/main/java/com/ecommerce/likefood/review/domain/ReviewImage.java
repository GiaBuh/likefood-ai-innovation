package com.ecommerce.likefood.review.domain;

import com.ecommerce.likefood.common.utils.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "review_images")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewImage extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String imageKey;

    @ManyToOne
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;
}
