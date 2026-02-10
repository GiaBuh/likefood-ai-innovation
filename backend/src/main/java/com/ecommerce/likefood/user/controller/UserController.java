package com.ecommerce.likefood.user.controller;

import com.ecommerce.likefood.common.response.PaginationResponse;
import com.ecommerce.likefood.common.utils.ApiMessage;
import com.ecommerce.likefood.user.dto.req.UserCreateRequest;
import com.ecommerce.likefood.user.dto.req.UserSpecRequest;
import com.ecommerce.likefood.user.dto.req.UserUpdateRequest;
import com.ecommerce.likefood.user.dto.res.UserResponse;
import com.ecommerce.likefood.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/users")
    @ApiMessage("Create user")
    public ResponseEntity<UserResponse> create(@RequestBody @Valid UserCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.userService.create(req));
    }

    @GetMapping("/users/{id}")
    @ApiMessage("Get user by ID")
    public ResponseEntity<UserResponse> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(this.userService.getById(id));
    }

    @GetMapping("/users")
    @ApiMessage("Get users with specification")
    public ResponseEntity<PaginationResponse> getAllUser(
            @ModelAttribute UserSpecRequest userSpecRequest,
            Pageable pageable
    ) {
        return ResponseEntity.ok(this.userService.getAll(userSpecRequest, pageable));
    }

    @PutMapping("/users/{id}")
    @ApiMessage("Update user by ID")
    public ResponseEntity<UserResponse> update(
            @PathVariable("id") String id,
            @RequestBody @Valid UserUpdateRequest request) {

        return ResponseEntity.ok(this.userService.update(id, request));
    }
}
