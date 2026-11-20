package com.mycompany.englishtutor.module.messaging.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.englishtutor.module.messaging.service.InternalPiiService;
import com.mycompany.englishtutor.shared.api.ApiResponse;

import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;

/** Endpoint nội bộ cho Rocket.Chat App; xác thực bằng chữ ký HMAC, không dùng JWT. */
@Hidden
@RestController
@RequestMapping("/api/v1/internal/chat")
@RequiredArgsConstructor
public class InternalChatController {

    private final InternalPiiService internalPiiService;

    @PostMapping("/pii-events")
    public ApiResponse<Void> piiEvent(@RequestBody String rawBody, @RequestHeader(value = "X-Signature", required = false) String signature) {
        internalPiiService.record(rawBody, signature);
        return ApiResponse.<Void>builder().message("OK").build();
    }
}
