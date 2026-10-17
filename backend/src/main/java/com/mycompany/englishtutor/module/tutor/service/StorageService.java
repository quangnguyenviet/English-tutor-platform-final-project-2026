package com.mycompany.englishtutor.module.tutor.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String uploadFile(String folder, MultipartFile file);

    void deleteFile(String key);
}
