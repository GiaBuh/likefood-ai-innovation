package com.ecommerce.likefood.common.utils;

import com.ecommerce.likefood.common.security.SecurityUtils;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@MappedSuperclass
public abstract class BaseEntity {
    private Instant createdAt;
    private Instant updatedAt;

    private String createdBy;
    private String updatedBy;

    @PrePersist
    public void handleBeforeCreate() {
        this.createdBy = SecurityUtils.getCurrentUserLogin().orElse("");
        this.createdAt = Instant.now();
    }

    @PreUpdate
    public void handleBeforeUpdate() {
        this.updatedBy = SecurityUtils.getCurrentUserLogin().orElse("");
        this.updatedAt = Instant.now();
    }
}
