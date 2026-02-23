package com.ecommerce.likefood.product.domain;

import com.ecommerce.likefood.common.utils.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Category extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column
    private String icon;

    @OneToMany(mappedBy = "category")
    @JsonIgnore
    @Builder.Default
    private List<Product> products = new ArrayList<>();
}
