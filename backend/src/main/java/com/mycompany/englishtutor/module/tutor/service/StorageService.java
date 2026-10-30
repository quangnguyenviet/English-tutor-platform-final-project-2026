package com.mycompany.englishtutor.module.tutor.service;

import java.time.Duration;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String uploadFile(String folder, MultipartFile file);

    /**
     * Upload không áp whitelist định dạng của dịch vụ (thuộc module quyết định
     * định dạng chấp nhận) — chỉ chặn tệp rỗng và tệp vượt {@code maxBytes}.
     * Dùng cho tài liệu buổi học (PDF, DOCX, ảnh, âm thanh).
     */
    String uploadFile(String folder, MultipartFile file, long maxBytes);

    void deleteFile(String key);

    /** Link tải tạm thời cho tệp riêng tư; nhận key hoặc URL trả về từ {@link #uploadFile}. */
    String presignedUrl(String keyOrUrl, Duration ttl);
}
