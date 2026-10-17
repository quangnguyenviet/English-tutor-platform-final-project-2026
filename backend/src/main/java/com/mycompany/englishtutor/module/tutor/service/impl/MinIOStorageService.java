package com.mycompany.englishtutor.module.tutor.service.impl;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import com.mycompany.englishtutor.module.tutor.service.FileStorageProperties;
import com.mycompany.englishtutor.module.tutor.service.StorageService;

import jakarta.annotation.PostConstruct;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class MinIOStorageService implements StorageService {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/gif", "image/webp");
    private static final Set<String> ALLOWED_DOCUMENT_TYPES = Set.of("application/pdf");
    private static final Set<String> ALLOWED_VIDEO_TYPES = Set.of("video/mp4", "video/mpeg", "video/quicktime");
    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    private final FileStorageProperties properties;
    private S3Client s3Client;

    @PostConstruct
    public void init() {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(
                properties.getAccessKey(),
                properties.getSecretKey());

        s3Client = S3Client.builder()
                .endpointOverride(java.net.URI.create(properties.getEndpoint()))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .region(Region.of(properties.getRegion()))
                .forcePathStyle(properties.isPathStyleAccessEnabled())
                .build();

        createBucketIfNotExists();
    }

    private void createBucketIfNotExists() {
        try {
            HeadBucketRequest headBucketRequest = HeadBucketRequest.builder()
                    .bucket(properties.getBucket())
                    .build();
            s3Client.headBucket(headBucketRequest);
            log.info("Bucket {} already exists", properties.getBucket());
        } catch (NoSuchBucketException e) {
            CreateBucketRequest createBucketRequest = CreateBucketRequest.builder()
                    .bucket(properties.getBucket())
                    .build();
            s3Client.createBucket(createBucketRequest);
            log.info("Created bucket {}", properties.getBucket());
        } catch (S3Exception e) {
            log.error("Error checking/creating bucket: {}", e.awsErrorDetails().errorMessage(), e);
            throw new RuntimeException("Failed to initialize S3 bucket", e);
        }
    }

    @Override
    public String uploadFile(String folder, MultipartFile file) {
        validateFile(file);

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String key = folder + "/" + UUID.randomUUID() + extension;

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(properties.getBucket())
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            log.info("Uploaded file {} to bucket {}", key, properties.getBucket());

            return properties.getEndpoint() + "/" + properties.getBucket() + "/" + key;
        } catch (IOException e) {
            log.error("Error uploading file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload file", e);
        }
    }

    @Override
    public void deleteFile(String key) {
        // Extract key from full URL if needed
        String objectKey = key;
        if (key.contains(properties.getBucket())) {
            objectKey = key.substring(key.indexOf(properties.getBucket()) + properties.getBucket().length() + 1);
        }

        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(properties.getBucket())
                .key(objectKey)
                .build();

        s3Client.deleteObject(deleteObjectRequest);
        log.info("Deleted file {}", objectKey);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File exceeds maximum size of 50MB");
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            throw new IllegalArgumentException("File content type is missing");
        }

        boolean isAllowed = ALLOWED_IMAGE_TYPES.contains(contentType)
                || ALLOWED_DOCUMENT_TYPES.contains(contentType)
                || ALLOWED_VIDEO_TYPES.contains(contentType);

        if (!isAllowed) {
            throw new IllegalArgumentException("File type not allowed. Allowed types: images, PDF, videos");
        }
    }
}
