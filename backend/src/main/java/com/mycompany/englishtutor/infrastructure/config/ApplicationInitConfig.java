package com.mycompany.englishtutor.infrastructure.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.domain.UserRole;
import com.mycompany.englishtutor.module.user.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ApplicationInitConfig {

    PasswordEncoder passwordEncoder;

    @NonFinal
    static final String ADMIN_USER_NAME = "admin";

    @NonFinal
    static final String ADMIN_PASSWORD = "admin";

    @NonFinal
    static final String RECEPTIONIST_USER_NAME = "receptionist";

    @NonFinal
    static final String RECEPTIONIST_PASSWORD = "receptionist";

    @NonFinal
    static final String TUTOR_USER_NAME = "tutor";

    @NonFinal
    static final String TUTOR_PASSWORD = "tutor";

    @NonFinal
    static final String STUDENT_USER_NAME = "student";

    @NonFinal
    static final String STUDENT_PASSWORD = "student";

    @Bean
    @ConditionalOnProperty(
            prefix = "spring",
            value = "datasource.driverClassName",
            havingValue = "org.postgresql.Driver")
    ApplicationRunner applicationRunner(UserRepository userRepository) {
        log.info("Initializing application.....");
        return args -> {
            seedUser(userRepository, ADMIN_USER_NAME, ADMIN_PASSWORD, UserRole.ADMIN);
            seedUser(userRepository, RECEPTIONIST_USER_NAME, RECEPTIONIST_PASSWORD, UserRole.RECEPTIONIST);
            seedUser(userRepository, TUTOR_USER_NAME, TUTOR_PASSWORD, UserRole.TUTOR);
            seedUser(userRepository, STUDENT_USER_NAME, STUDENT_PASSWORD, UserRole.STUDENT);

            log.info("Application initialization completed .....");
        };
    }

    private void seedUser(UserRepository userRepository, String username, String password, UserRole role) {
        if (userRepository.findByUsername(username).isEmpty()) {
            userRepository.save(User.builder()
                    .username(username)
                    .passwordHash(passwordEncoder.encode(password))
                    .fullName(username)
                    .role(role.name())
                    .status("ACTIVE")
                    .mustChangePassword(true)
                    .build());
            log.warn("{} user has been created with default password: {}", username, password);
        }
    }
}
