package com.mycompany.englishtutor.module.tutor.service;

import java.util.Map;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.testcontainers.containers.MinIOContainer;

public class MinIOTestInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    private static MinIOContainer minIOContainer;

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment env = applicationContext.getEnvironment();

        // Nếu s3.endpoint đã được cung cấp (ví dụ từ GitHub Actions service) thì không khởi động Testcontainers
        if (env.containsProperty("s3.endpoint")) {
            return;
        }

        // Local development: khởi động MinIO qua Testcontainers
        if (minIOContainer == null) {
            minIOContainer = new MinIOContainer("minio/minio:latest")
                    .withEnv("MINIO_ROOT_USER", "minio_user")
                    .withEnv("MINIO_ROOT_PASSWORD", "minio_password_123")
                    .withExposedPorts(9000);
            minIOContainer.start();
        }

        String endpoint = String.format("http://%s:%s", minIOContainer.getHost(), minIOContainer.getMappedPort(9000));
        Map<String, Object> properties = Map.of("s3.endpoint", endpoint);
        env.getPropertySources().addLast(new MapPropertySource("minioTestContainer", properties));
    }
}
