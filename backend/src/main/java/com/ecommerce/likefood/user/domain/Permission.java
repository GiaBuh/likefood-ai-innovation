package com.ecommerce.likefood.user.domain;

import com.ecommerce.likefood.common.utils.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "permissions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"resource", "action"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Permission extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType resource;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActionType action;

    public String toPermissionString() {
        return resource.name() + ":" + action.name();
    }
}
