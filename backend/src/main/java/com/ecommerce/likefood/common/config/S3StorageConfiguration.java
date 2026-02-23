package com.ecommerce.likefood.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;

import java.net.URI;

@Configuration
@ConditionalOnProperty(prefix = "likefood.storage.s3", name = "enabled", havingValue = "true")
public class S3StorageConfiguration {

    @Bean
    public S3Client s3Client(
            @Value("${likefood.storage.s3.access-key}") String accessKey,
            @Value("${likefood.storage.s3.secret-key}") String secretKey,
            @Value("${likefood.storage.s3.region}") String region,
            @Value("${likefood.storage.s3.endpoint:}") String endpoint
    ) {
        S3ClientBuilder builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(
                        StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey))
                );

        if (endpoint != null && !endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint));
        }

        return builder.build();
    }
}
