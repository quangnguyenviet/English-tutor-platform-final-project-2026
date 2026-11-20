package com.mycompany.englishtutor.module.messaging.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Bật @Scheduled cho các job của MSG (outbox, hết hạn đề xuất, lớp ngắn hạn). */
@Configuration
@EnableScheduling
public class MessagingSchedulingConfig {}
