package com.ecommerce.likefood.user.controller;

import com.ecommerce.likefood.common.utils.ApiMessage;
import com.ecommerce.likefood.user.domain.Permission;
import com.ecommerce.likefood.user.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class PermissionController {
    private final PermissionRepository permissionRepository;

    @GetMapping("/permissions")
    @PreAuthorize("hasPermission(null, 'STAFF', 'VIEW')")
    @ApiMessage("Get all permissions")
    public ResponseEntity<List<Map<String, Object>>> getAll() {
        List<Permission> permissions = permissionRepository.findAll();
        List<Map<String, Object>> response = permissions.stream().map(p -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", p.getId());
            map.put("resource", p.getResource().name());
            map.put("action", p.getAction().name());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
}
