package com.mycompany.englishtutor.module.tutor.service;

import java.time.Duration;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String uploadFile(String folder, MultipartFile file);

    void deleteFile(String key);

    /** Link tải tạm thời cho tệp riêng tư; nhận key hoặc URL trả về từ {@link #uploadFile}. */
    String presignedUrl(String keyOrUrl, Duration ttl);
}
