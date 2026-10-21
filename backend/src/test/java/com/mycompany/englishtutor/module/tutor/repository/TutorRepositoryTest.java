package com.mycompany.englishtutor.module.tutor.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.OffsetDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import com.mycompany.englishtutor.module.tutor.domain.Tutor;
import com.mycompany.englishtutor.module.user.domain.User;

/**
 * Kiểm chứng truy vấn {@link TutorRepository#findPendingByProfileStatus(String)}
 * chạy được thực tế (JPQL {@code ORDER BY ... NULLS LAST}) và sắp xếp đúng thứ tự.
 */
@DataJpaTest
@TestPropertySource("/test.properties")
class TutorRepositoryTest {

    @Autowired
    TutorRepository tutorRepository;

    @Autowired
    TestEntityManager entityManager;

    @Test
    void findPendingByProfileStatus_ordersBySubmittedAtAscAndPutsNullLast() {
        // GIVEN: 3 hồ sơ PENDING — 1 không có submittedAt, 1 sớm, 1 muộn
        Tutor nullSubmitted = createTutor("giasu_null", "PENDING", null);
        Tutor earliest = createTutor("giasu_som", "PENDING", OffsetDateTime.now().minusDays(2));
        Tutor latest = createTutor("giasu_muon", "PENDING", OffsetDateTime.now().minusDays(1));
        createTutor("giasu_active", "ACTIVE", OffsetDateTime.now().minusDays(3));

        entityManager.flush();
        entityManager.clear();

        // WHEN
        List<Tutor> result = tutorRepository.findPendingByProfileStatus("PENDING");

        // THEN: chỉ lấy hồ sơ PENDING, sớm nhất trước, hồ sơ null submittedAt nằm cuối
        assertThat(result)
                .extracting(Tutor::getId)
                .containsExactly(earliest.getId(), latest.getId(), nullSubmitted.getId());
    }

    @Test
    void findPendingByProfileStatus_noPending_returnsEmptyList() {
        // GIVEN
        createTutor("giasu_incomplete", "INCOMPLETE", null);

        entityManager.flush();
        entityManager.clear();

        // WHEN
        List<Tutor> result = tutorRepository.findPendingByProfileStatus("PENDING");

        // THEN
        assertThat(result).isEmpty();
    }

    private Tutor createTutor(String username, String profileStatus, OffsetDateTime submittedAt) {
        User user = User.builder()
                .username(username)
                .passwordHash("hash")
                .fullName("Gia sư " + username)
                .role("TUTOR")
                .status("ACTIVE")
                .mustChangePassword(false)
                .build();

        entityManager.persist(user);

        Tutor tutor = Tutor.builder()
                .user(user)
                .profileStatus(profileStatus)
                .submittedAt(submittedAt)
                .build();

        return entityManager.persistAndFlush(tutor);
    }
}
