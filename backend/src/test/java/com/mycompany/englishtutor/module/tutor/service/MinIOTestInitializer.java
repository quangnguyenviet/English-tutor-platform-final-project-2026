package com.mycompany.englishtutor.module.tutor.service;

import java.util.Map;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.testcontainers.containers.MinIOContainer;

public class MinIOTestInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    private static final MinIOContainer minIOContainer = new MinIOContainer("minio/minio:latest")
            .withEnv("MINIO_ROOT_USER", "minio_user")
            .withEnv("MINIO_ROOT_PASSWORD", "minio_password_123")
            .withExposedPorts(9000);

    static {
        minIOContainer.start();
    }

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment env = applicationContext.getEnvironment();
        String endpoint = String.format("http://%s:%s", minIOContainer.getHost(), minIOContainer.getMappedPort(9000));
        Map<String, Object> properties = Map.of("s3.endpoint", endpoint);
        env.getPropertySources().addLast(new MapPropertySource("minioTestContainer", properties));
    }
}
