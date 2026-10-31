package com.mycompany.englishtutor.module.quiz.ai.dto;

/** Tin hội thoại gần nhất (chat stateless — frontend gửi kèm, AD-2). */
public record AiRecentMessage(String role, String content) {}
