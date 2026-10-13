package com.mycompany.englishtutor.infrastructure.config;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.mycompany.englishtutor.module.role.constant.PredefinedRole;
import com.mycompany.englishtutor.module.role.domain.Role;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.role.repository.RoleRepository;
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
    ApplicationRunner applicationRunner(UserRepository userRepository, RoleRepository roleRepository) {
        log.info("Initializing application.....");
        return args -> {
            Map<String, Role> roles = seedRoles(roleRepository);

            seedUser(userRepository, ADMIN_USER_NAME, ADMIN_PASSWORD, roles.get(PredefinedRole.ADMIN_ROLE));
            seedUser(
                    userRepository,
                    RECEPTIONIST_USER_NAME,
                    RECEPTIONIST_PASSWORD,
                    roles.get(PredefinedRole.RECEPTIONIST_ROLE));
            seedUser(userRepository, TUTOR_USER_NAME, TUTOR_PASSWORD, roles.get(PredefinedRole.TUTOR_ROLE));
            seedUser(userRepository, STUDENT_USER_NAME, STUDENT_PASSWORD, roles.get(PredefinedRole.STUDENT_ROLE));

            log.info("Application initialization completed .....");
        };
    }

    private Map<String, Role> seedRoles(RoleRepository roleRepository) {
        List<Role> predefinedRoles = List.of(
                Role.builder()
                        .name(PredefinedRole.USER_ROLE)
                        .description("User role")
                        .build(),
                Role.builder()
                        .name(PredefinedRole.ADMIN_ROLE)
                        .description("Admin role")
                        .build(),
                Role.builder()
                        .name(PredefinedRole.RECEPTIONIST_ROLE)
                        .description("Receptionist role")
                        .build(),
                Role.builder()
                        .name(PredefinedRole.TUTOR_ROLE)
                        .description("Tutor role")
                        .build(),
                Role.builder()
                        .name(PredefinedRole.STUDENT_ROLE)
                        .description("Student role")
                        .build());

        predefinedRoles.forEach(
                role -> roleRepository.findById(role.getName()).orElseGet(() -> roleRepository.save(role)));

        return roleRepository.findAllById(predefinedRoles.stream().map(Role::getName).toList()).stream()
                .collect(Collectors.toMap(Role::getName, role -> role));
    }

    private void seedUser(UserRepository userRepository, String username, String password, Role role) {
        if (userRepository.findByUsername(username).isEmpty()) {
            userRepository.save(User.builder()
                    .username(username)
                    .password(passwordEncoder.encode(password))
                    .roles(new HashSet<>(Set.of(role)))
                    .build());
            log.warn("{} user has been created with default password: {}", username, password);
        }
    }
}
