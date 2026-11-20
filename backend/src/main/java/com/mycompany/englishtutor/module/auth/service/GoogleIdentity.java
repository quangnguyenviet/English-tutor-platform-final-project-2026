package com.mycompany.englishtutor.module.auth.service;

public record GoogleIdentity(String subject, String email, String fullName, String avatarUrl) {}
