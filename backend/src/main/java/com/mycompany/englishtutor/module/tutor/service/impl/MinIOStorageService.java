package com.mycompany.englishtutor.module.tutor.service.impl;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

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

        try {
            createBucketIfNotExists();
        } catch (Exception e) {
            log.warn("Could not initialize S3 bucket (MinIO may not be running): {}", e.getMessage());
        }
        applyPublicReadPolicy();
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

    /**
     * Cấp quyền đọc công khai cho các tiền tố cần hiển thị trực tiếp trên trình duyệt
     * (ảnh đại diện trong thẻ {@code <img>}, file chứng chỉ mở bằng link).
     */
    private void applyPublicReadPolicy() {
        List<String> prefixes = properties.getPublicReadPrefixes();
        if (prefixes == null || prefixes.isEmpty()) {
            return;
        }

        String resources = prefixes.stream()
                .map(prefix -> prefix.replaceAll("^/+|/+$", ""))
                .filter(prefix -> !prefix.isBlank())
                .map(prefix -> "arn:aws:s3:::" + properties.getBucket() + "/" + prefix + "/*")
                .map(arn -> "\"" + arn + "\"")
                .collect(Collectors.joining(","));

        if (resources.isBlank()) {
            return;
        }

        String policy = """
                {
                  "Version": "2012-10-17",
                  "Statement": [
                    {
                      "Effect": "Allow",
                      "Principal": {"AWS": ["*"]},
                      "Action": ["s3:GetObject"],
                      "Resource": [%s]
                    }
                  ]
                }
                """.formatted(resources);

        try {
            s3Client.putBucketPolicy(PutBucketPolicyRequest.builder()
                    .bucket(properties.getBucket())
                    .policy(policy)
                    .build());
            log.info("Applied public read policy for prefixes {} in bucket {}",
                    prefixes, properties.getBucket());
        } catch (S3Exception e) {
            // Không chặn khởi động ứng dụng: nếu bucket chặn public access (AWS),
            // ảnh sẽ lỗi 403 và cần xử lý qua presigned URL.
            log.error("Could not apply public read policy for bucket {}: {}",
                    properties.getBucket(), e.awsErrorDetails().errorMessage(), e);
        }
    }

    @Override
    public String uploadFile(String folder, MultipartFile file) {
        validateFile(file, MAX_FILE_SIZE, true);
        return storeFile(folder, file);
    }

    @Override
    public String uploadFile(String folder, MultipartFile file, long maxBytes) {
        validateFile(file, maxBytes, false);
        return storeFile(folder, file);
    }

    private String storeFile(String folder, MultipartFile file) {
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

    @Override
    public String presignedUrl(String keyOrUrl, Duration ttl) {
        String objectKey = keyOrUrl;
        String bucketMarker = "/" + properties.getBucket() + "/";
        if (keyOrUrl.contains(bucketMarker)) {
            objectKey = keyOrUrl.substring(keyOrUrl.indexOf(bucketMarker) + bucketMarker.length());
        }

        AwsBasicCredentials credentials =
                AwsBasicCredentials.create(properties.getAccessKey(), properties.getSecretKey());
        try (S3Presigner presigner = S3Presigner.builder()
                .endpointOverride(java.net.URI.create(properties.getEndpoint()))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .region(Region.of(properties.getRegion()))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(properties.isPathStyleAccessEnabled())
                        .build())
                .build()) {
            GetObjectPresignRequest request = GetObjectPresignRequest.builder()
                    .signatureDuration(ttl)
                    .getObjectRequest(GetObjectRequest.builder()
                            .bucket(properties.getBucket())
                            .key(objectKey)
                            .build())
                    .build();
            return presigner.presignGetObject(request).url().toString();
        }
    }

    private void validateFile(MultipartFile file, long maxBytes, boolean checkType) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException(
                    "File exceeds maximum size of " + (maxBytes / (1024 * 1024)) + "MB");
        }

        if (checkType) {
            String contentType = file.getContentType();
            if (contentType == null) {
                throw new IllegalArgumentException("File content type is missing");
            }

            boolean isAllowed = ALLOWED_IMAGE_TYPES.contains(contentType)
                    || ALLOWED_DOCUMENT_TYPES.contains(contentType)
                    || ALLOWED_VIDEO_TYPES.contains(contentType);

            if (!isAllowed) {
                throw new IllegalArgumentException(
                        "File type not allowed. Allowed types: images, PDF, videos");
            }
        }
    }
}
