package com.ecommerce.likefood.storage.controller;

import com.ecommerce.likefood.storage.dto.ImageUrlResponse;
import com.ecommerce.likefood.storage.dto.UploadImageResponse;
import com.ecommerce.likefood.storage.enums.StorageObjectType;
import com.ecommerce.likefood.storage.service.StorageService;
import com.ecommerce.likefood.common.utils.ApiMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/storage")
@RequiredArgsConstructor
public class StorageController {

    private final StorageService storageService;

    @PostMapping(value = "/upload-avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @ApiMessage("Upload avatar successfully")
    public ResponseEntity<UploadImageResponse> uploadAvatar(@RequestPart("file") MultipartFile file) {
        UploadImageResponse response = this.storageService.uploadImage(file, StorageObjectType.AVATAR);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Upload image successfully")
    public ResponseEntity<UploadImageResponse> uploadImage(
            @RequestPart("file") MultipartFile file,
            @RequestParam(name = "type", defaultValue = "PRODUCT") StorageObjectType type
    ) {
        UploadImageResponse response = this.storageService.uploadImage(file, type);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/delete-image")
    @PreAuthorize("hasRole('ADMIN')")
    @ApiMessage("Delete image successfully")
    public ResponseEntity<Void> deleteImage(@RequestParam("key") String key) {
        this.storageService.deleteProductImageByKey(key);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/public-url")
    @ApiMessage("Get public image URL successfully")
    public ResponseEntity<ImageUrlResponse> getPublicUrl(@RequestParam("key") String key) {
        String imageUrl = this.storageService.getPublicImageUrl(key);
        return ResponseEntity.ok(ImageUrlResponse.builder().url(imageUrl).build());
    }
}
