package com.ecommerce.likefood.storage.service;

import com.ecommerce.likefood.storage.dto.UploadImageResponse;
import com.ecommerce.likefood.storage.enums.StorageObjectType;
import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    UploadImageResponse uploadImage(MultipartFile file, StorageObjectType type);

    /**
     * Fetches image from URL and uploads to S3. Returns S3 key.
     */
    UploadImageResponse uploadImageFromUrl(String imageUrl);

    void deleteProductImageByKey(String key);

    String getPublicImageUrl(String key);
}
