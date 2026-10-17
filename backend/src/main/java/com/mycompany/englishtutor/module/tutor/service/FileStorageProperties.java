package com.mycompany.englishtutor.module.tutor.service;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "s3")
public class FileStorageProperties {
    private String endpoint;
    private String bucket;
    private String accessKey;
    private String secretKey;
    private String region;
    private boolean pathStyleAccessEnabled = true;
}
