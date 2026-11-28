package com.mycompany.englishtutor.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.orm.jpa.support.OpenEntityManagerInViewInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Thay cấu hình Open-EntityManager-in-View mặc định của Spring Boot để loại trừ các endpoint SSE.
 *
 * <p>Với OSIV, EntityManager (và connection JDBC đã lấy) được giữ tới khi request kết thúc. Request SSE sống tới
 * 30 phút nên mỗi tab mở kênh realtime sẽ chiếm một connection của pool Hikari (mặc định 10) suốt thời gian đó;
 * vài tab/lần kết nối lại là cạn pool, mọi request khác báo "Could not open JPA EntityManager for transaction"
 * và introspect token thất bại thành 401. Endpoint SSE không cần lazy-loading nên tắt OSIV cho chúng.
 *
 * <p>Khai báo bean {@link OpenEntityManagerInViewInterceptor} khiến auto-config mặc định của Boot tự lùi lại.
 */
@Configuration
public class OpenEntityManagerInViewConfig implements WebMvcConfigurer {

    private static final String[] SSE_PATHS = {"/api/v1/chat/stream"};

    @Bean
    public OpenEntityManagerInViewInterceptor openEntityManagerInViewInterceptor() {
        return new OpenEntityManagerInViewInterceptor();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addWebRequestInterceptor(openEntityManagerInViewInterceptor()).excludePathPatterns(SSE_PATHS);
    }
}
