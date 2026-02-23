package com.ecommerce.likefood.storage.service.impl;

import com.ecommerce.likefood.common.exception.AppException;
import com.ecommerce.likefood.storage.dto.UploadImageResponse;
import com.ecommerce.likefood.storage.enums.StorageObjectType;
import com.ecommerce.likefood.storage.service.StorageService;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class S3StorageServiceImpl implements StorageService {

    private final ObjectProvider<S3Client> s3ClientProvider;
    private final String bucket;
    private final String publicBaseUrl;
    private final long maxImageSizeBytes;

    public S3StorageServiceImpl(
            ObjectProvider<S3Client> s3ClientProvider,
            @Value("${likefood.storage.s3.bucket:}") String bucket,
            @Value("${likefood.storage.s3.public-base-url:}") String publicBaseUrl,
            @Value("${likefood.storage.max-image-size-bytes:5242880}") long maxImageSizeBytes
    ) {
        this.s3ClientProvider = s3ClientProvider;
        this.bucket = bucket;
        this.publicBaseUrl = publicBaseUrl;
        this.maxImageSizeBytes = maxImageSizeBytes;
    }

    @Override
    public UploadImageResponse uploadImage(MultipartFile file, StorageObjectType type) {
        validateFile(file);

        S3Client s3Client = requireS3Client();

        String key = buildObjectKey(file.getOriginalFilename(), type);
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(
                    request,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );
        } catch (IOException e) {
            throw new AppException("Failed to read uploaded file");
        } catch (SdkException e) {
            throw new AppException("Failed to upload image to S3: " + e.getMessage());
        }

        return UploadImageResponse.builder()
                .key(key)
                .build();
    }

    @Override
    public UploadImageResponse uploadImageFromUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            throw new AppException("Image URL is required");
        }
        try {
            HttpClient client = HttpClient.newBuilder()
                    .version(HttpClient.Version.HTTP_1_1)
                    .followRedirects(HttpClient.Redirect.NORMAL)
                    .build();

            byte[] bytes = null;
            String contentType = null;
            String resolvedUrl = sanitizeUrl(imageUrl);

            for (int attempt = 0; attempt < 2; attempt++) {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(resolvedUrl))
                        .header("User-Agent", "Mozilla/5.0")
                        .GET()
                        .timeout(java.time.Duration.ofSeconds(30))
                        .build();
                HttpResponse<byte[]> response = client.send(request, HttpResponse.BodyHandlers.ofByteArray());
                if (response.statusCode() != 200) {
                    throw new AppException("Failed to fetch image from URL: HTTP " + response.statusCode());
                }
                bytes = response.body();
                if (bytes == null || bytes.length == 0) {
                    throw new AppException("Empty content from URL");
                }
                contentType = response.headers().firstValue("Content-Type").orElse("");

                if (contentType.startsWith("image/")) {
                    break;
                }

                if (attempt == 0 && contentType.contains("text/html")) {
                    String ogImage = extractOgImage(new String(bytes, java.nio.charset.StandardCharsets.UTF_8));
                    if (ogImage != null) {
                        resolvedUrl = sanitizeUrl(ogImage);
                        continue;
                    }
                    throw new AppException("URL is a webpage with no og:image. Please use a direct image URL");
                }

                throw new AppException("URL does not point to an image. Content-Type: " + contentType);
            }

            String ext = contentType.contains("png") ? "png" : contentType.contains("webp") ? "webp" : "jpg";
            String key = buildObjectKey("import-" + UUID.randomUUID() + "." + ext, StorageObjectType.PRODUCT);
            S3Client s3Client = requireS3Client();
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(contentType)
                    .build();
            s3Client.putObject(putRequest, RequestBody.fromInputStream(new ByteArrayInputStream(bytes), bytes.length));
            return UploadImageResponse.builder().key(key).build();
        } catch (AppException e) {
            throw e;
        } catch (IOException | InterruptedException e) {
            throw new AppException("Failed to fetch/upload image from URL: " + e.getMessage());
        }
    }

    private static final Pattern OG_IMAGE_PATTERN = Pattern.compile(
            "<meta[^>]+property=[\"']og:image[\"'][^>]+content=[\"']([^\"']+)[\"']",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern OG_IMAGE_PATTERN_REVERSED = Pattern.compile(
            "<meta[^>]+content=[\"']([^\"']+)[\"'][^>]+property=[\"']og:image[\"']",
            Pattern.CASE_INSENSITIVE
    );

    private String extractOgImage(String html) {
        Matcher m = OG_IMAGE_PATTERN.matcher(html);
        if (m.find()) return m.group(1);
        m = OG_IMAGE_PATTERN_REVERSED.matcher(html);
        if (m.find()) return m.group(1);
        return null;
    }

    private String sanitizeUrl(String url) {
        if (url == null) return null;
        String cleaned = url.trim().replaceAll("[,;]+$", "");
        if (cleaned.contains(" ")) {
            cleaned = cleaned.replace(" ", "%20");
        }
        return cleaned;
    }

    @Override
    public void deleteProductImageByKey(String key) {
        S3Client s3Client = requireS3Client();
        if (key == null || key.isBlank()) {
            throw new AppException("Image key is required");
        }

        try {
            DeleteObjectRequest request = DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();
            s3Client.deleteObject(request);
        } catch (SdkException e) {
            throw new AppException("Failed to delete image from S3: " + e.getMessage());
        }
    }

    @Override
    public String getPublicImageUrl(String key) {
        if (key == null || key.isBlank()) {
            throw new AppException("Image key is required");
        }
        return resolvePublicUrl(key);
    }

    private S3Client requireS3Client() {
        S3Client s3Client = this.s3ClientProvider.getIfAvailable();
        if (s3Client == null) {
            throw new AppException("S3 storage is not enabled. Please set S3_ENABLED=true");
        }

        if (bucket == null || bucket.isBlank()) {
            throw new AppException("S3 bucket is missing. Please set AWS_S3_BUCKET");
        }
        return s3Client;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException("Image file is required");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new AppException("Only image files are allowed");
        }

        if (file.getSize() > maxImageSizeBytes) {
            throw new AppException("Image file is too large. Max allowed size is %d MB"
                    .formatted(Math.max(1, maxImageSizeBytes / (1024 * 1024))));
        }
    }

    private String buildObjectKey(String originalFilename, StorageObjectType type) {
        String fileName = originalFilename == null ? "image" : originalFilename;
        String safeFileName = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
        LocalDate today = LocalDate.now();
        StorageObjectType safeType = type == null ? StorageObjectType.PRODUCT : type;

        return "%s/%d/%02d/%s-%s".formatted(
                safeType.getFolder(),
                today.getYear(),
                today.getMonthValue(),
                UUID.randomUUID(),
                safeFileName
        );
    }

    private String resolvePublicUrl(String key) {
        if (publicBaseUrl != null && !publicBaseUrl.isBlank()) {
            return publicBaseUrl.replaceAll("/+$", "") + "/" + key;
        }
        return "https://%s.s3.amazonaws.com/%s".formatted(bucket, key);
    }
}
