package com.ecommerce.likefood.user.controller;

import com.ecommerce.likefood.common.response.DeleteResponse;
import com.ecommerce.likefood.common.utils.ApiMessage;
import com.ecommerce.likefood.user.domain.Role;
import com.ecommerce.likefood.user.dto.req.RoleCreateRequest;
import com.ecommerce.likefood.user.dto.res.RoleResponse;
import com.ecommerce.likefood.user.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class RoleController {
    private final RoleService roleService;

    @PostMapping("/roles")
    @ApiMessage("Create role")
    public ResponseEntity<Role> create(@RequestBody @Valid RoleCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.roleService.create(req));
    }

    @GetMapping("/roles")
    @ApiMessage("Get all roles")
    public ResponseEntity<List<RoleResponse>> getAll() {
        return ResponseEntity.ok(this.roleService.getAll());
    }

    @PutMapping("/roles/{id}")
    @ApiMessage("Update name role by ID")
    public ResponseEntity<RoleResponse> update(@PathVariable("id") String id,
                                               @RequestBody @Valid RoleCreateRequest request) {
        return ResponseEntity.ok(this.roleService.update(id, request));
    }

    @DeleteMapping("/roles/{id}")
    @ApiMessage("Delete role by ID")
    public ResponseEntity<DeleteResponse> delete(@PathVariable("id") String id) {
        this.roleService.delete(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(new DeleteResponse());
    }
}
