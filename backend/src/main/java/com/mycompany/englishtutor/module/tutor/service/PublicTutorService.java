package com.mycompany.englishtutor.module.tutor.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.tutor.api.response.PublicTutorResponse;
import com.mycompany.englishtutor.module.tutor.api.response.TutorProfileResponse;
import com.mycompany.englishtutor.module.tutor.domain.Tutor;
import com.mycompany.englishtutor.module.tutor.domain.TutorAvailability;
import com.mycompany.englishtutor.module.tutor.domain.TutorCredential;
import com.mycompany.englishtutor.module.tutor.domain.TutorPrice;
import com.mycompany.englishtutor.module.tutor.domain.TutorServiceArea;
import com.mycompany.englishtutor.module.tutor.domain.TutorSpecialty;
import com.mycompany.englishtutor.module.tutor.domain.enums.ProfileStatus;
import com.mycompany.englishtutor.module.tutor.domain.enums.TeachingMode;
import com.mycompany.englishtutor.module.tutor.repository.TutorAvailabilityRepository;
import com.mycompany.englishtutor.module.tutor.repository.TutorCredentialRepository;
import com.mycompany.englishtutor.module.tutor.repository.TutorPriceRepository;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.module.tutor.repository.TutorServiceAreaRepository;
import com.mycompany.englishtutor.module.tutor.repository.TutorSpecialtyRepository;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;
import com.mycompany.englishtutor.shared.util.PublicSearchSupport;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PublicTutorService {
    TutorRepository tutorRepository;
    TutorServiceAreaRepository tutorServiceAreaRepository;
    TutorSpecialtyRepository tutorSpecialtyRepository;
    TutorPriceRepository tutorPriceRepository;
    TutorAvailabilityRepository tutorAvailabilityRepository;
    TutorCredentialRepository tutorCredentialRepository;

    /** Bộ lọc tìm gia sư công khai; mọi trường đều tuỳ chọn. */
    public record Filter(
            String keyword,
            String province,
            String district,
            String gender,
            String teachingMode,
            List<String> specialties,
            String gradeGroup) {}

    @Transactional(readOnly = true)
    public PageResponse<PublicTutorResponse> searchActiveTutors(Filter filter, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(
                PublicSearchSupport.clampPage(page),
                PublicSearchSupport.clampSize(size),
                Sort.by(Sort.Order.desc("updatedAt"), Sort.Order.desc("id")));

        Page<Tutor> tutors = tutorRepository.findAll(buildSpecification(filter), pageable);
        List<PublicTutorResponse> items = mapToPublicResponses(tutors.getContent());
        return PageResponse.of(items, tutors.getNumber(), tutors.getSize(), tutors.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PublicTutorResponse getActiveTutor(Long tutorId) {
        Tutor tutor = tutorRepository
                .findPublicByIdAndProfileStatus(tutorId, ProfileStatus.ACTIVE.name())
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_PROFILE_UNAVAILABLE));
        return mapToPublicResponses(List.of(tutor)).get(0);
    }

    private Specification<Tutor> buildSpecification(Filter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("profileStatus"), ProfileStatus.ACTIVE.name()));

            String keyword = PublicSearchSupport.normalize(filter.keyword());
            if (keyword != null) {
                String pattern = PublicSearchSupport.likeContains(keyword);
                predicates.add(cb.or(
                        likeUnaccent(cb, root.get("user").<String>get("fullName"), pattern),
                        likeUnaccent(cb, root.<String>get("university"), pattern)));
            }

            String gender = filter.gender() == null ? "" : filter.gender().trim().toUpperCase();
            if (!gender.isEmpty()) {
                predicates.add(cb.equal(root.get("user").get("gender"), gender));
            }

            String province = PublicSearchSupport.normalize(filter.province());
            String district = PublicSearchSupport.normalize(filter.district());
            if (province != null || district != null) {
                Subquery<Long> sub = query.subquery(Long.class);
                Root<TutorServiceArea> area = sub.from(TutorServiceArea.class);
                List<Predicate> areaPredicates = new ArrayList<>();
                areaPredicates.add(cb.equal(area.get("tutor"), root));
                if (province != null) {
                    areaPredicates.add(likeUnaccent(
                            cb, area.<String>get("province"), PublicSearchSupport.likeContains(province)));
                }
                if (district != null) {
                    areaPredicates.add(likeUnaccent(
                            cb, area.<String>get("district"), PublicSearchSupport.likeContains(district)));
                }
                sub.select(area.<Long>get("id")).where(areaPredicates.toArray(Predicate[]::new));
                predicates.add(cb.exists(sub));
            }

            TeachingMode mode = parseTeachingMode(filter.teachingMode());
            if (mode != null) {
                Subquery<Long> sub = query.subquery(Long.class);
                Root<TutorPrice> price = sub.from(TutorPrice.class);
                sub.select(price.<Long>get("id"))
                        .where(cb.equal(price.get("tutor"), root), cb.equal(price.get("teachingMode"), mode));
                predicates.add(cb.exists(sub));
            }

            List<String> specialties = filter.specialties() == null
                    ? List.of()
                    : filter.specialties().stream()
                            .map(PublicSearchSupport::normalize)
                            .filter(Objects::nonNull)
                            .toList();
            if (!specialties.isEmpty()) {
                predicates.add(cb.exists(verifiedSpecialtyExists(query.subquery(Long.class), root, cb, "specialty", specialties)));
            }

            List<String> gradePatterns = PublicSearchSupport.gradePatterns(filter.gradeGroup());
            if (!gradePatterns.isEmpty()) {
                predicates.add(cb.exists(verifiedSpecialtyExists(query.subquery(Long.class), root, cb, "gradeLevel", gradePatterns)));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    /** Subquery: gia sư có chuyên môn đã xác minh mà cột {@code column} chứa một trong các cụm từ. */
    private static Subquery<Long> verifiedSpecialtyExists(
            Subquery<Long> sub, Root<Tutor> tutor, CriteriaBuilder cb, String column, List<String> values) {
        Root<TutorSpecialty> specialty = sub.from(TutorSpecialty.class);
        Predicate anyValue = cb.or(values.stream()
                .map(value -> likeUnaccent(cb, specialty.<String>get(column), PublicSearchSupport.likeContains(value)))
                .toArray(Predicate[]::new));
        return sub.select(specialty.<Long>get("id"))
                .where(cb.equal(specialty.get("tutor"), tutor), cb.isTrue(specialty.get("isVerified")), anyValue);
    }

    private static Predicate likeUnaccent(CriteriaBuilder cb, Path<String> column, String pattern) {
        Expression<String> normalized = cb.function("unaccent", String.class, cb.lower(column));
        return cb.like(normalized, pattern, '\\');
    }

    private static TeachingMode parseTeachingMode(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return TeachingMode.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    /** Map hàng loạt: mỗi bảng con chỉ cần 1 truy vấn cho cả trang, thay vì 5 truy vấn / gia sư. */
    private List<PublicTutorResponse> mapToPublicResponses(List<Tutor> tutors) {
        if (tutors.isEmpty()) {
            return List.of();
        }
        List<Long> ids = tutors.stream().map(Tutor::getId).toList();
        Map<Long, List<TutorServiceArea>> areas =
                groupByTutor(tutorServiceAreaRepository.findByTutorIdIn(ids), a -> a.getTutor().getId());
        Map<Long, List<TutorSpecialty>> specialties =
                groupByTutor(tutorSpecialtyRepository.findByTutorIdIn(ids), s -> s.getTutor().getId());
        Map<Long, List<TutorPrice>> prices =
                groupByTutor(tutorPriceRepository.findByTutorIdIn(ids), p -> p.getTutor().getId());
        Map<Long, List<TutorAvailability>> availabilities =
                groupByTutor(tutorAvailabilityRepository.findByTutorIdIn(ids), a -> a.getTutor().getId());
        Map<Long, List<TutorCredential>> credentials =
                groupByTutor(tutorCredentialRepository.findByTutorIdIn(ids), c -> c.getTutor().getId());

        return tutors.stream()
                .map(tutor -> mapToPublicResponse(
                        tutor,
                        areas.getOrDefault(tutor.getId(), List.of()),
                        specialties.getOrDefault(tutor.getId(), List.of()),
                        prices.getOrDefault(tutor.getId(), List.of()),
                        availabilities.getOrDefault(tutor.getId(), List.of()),
                        credentials.getOrDefault(tutor.getId(), List.of())))
                .toList();
    }

    private static <T> Map<Long, List<T>> groupByTutor(Collection<T> rows, Function<T, Long> tutorId) {
        return rows.stream().collect(Collectors.groupingBy(tutorId));
    }

    private PublicTutorResponse mapToPublicResponse(
            Tutor tutor,
            List<TutorServiceArea> areas,
            List<TutorSpecialty> specialties,
            List<TutorPrice> prices,
            List<TutorAvailability> availabilities,
            List<TutorCredential> credentials) {
        return PublicTutorResponse.builder()
                .tutorId(tutor.getId())
                .fullName(tutor.getUser().getFullName())
                .gender(tutor.getUser().getGender())
                .avatarUrl(tutor.getUser().getAvatarUrl())
                .university(tutor.getUniversity())
                .educationStatus(tutor.getEducationStatus())
                .experienceYears(
                        tutor.getExperienceYears() == null ? null : tutor.getExperienceYears().intValue())
                .bio(tutor.getBio())
                .videoUrl(tutor.getVideoUrl())
                .serviceAreas(areas.stream()
                        .map(area -> TutorProfileResponse.ServiceAreaResponse.builder()
                                .id(area.getId())
                                .province(area.getProvince())
                                .district(area.getDistrict())
                                .build())
                        .toList())
                .specialties(specialties.stream()
                        .filter(specialty -> Boolean.TRUE.equals(specialty.getIsVerified()))
                        .map(specialty -> TutorProfileResponse.SpecialtyResponse.builder()
                                .id(specialty.getId())
                                .specialty(specialty.getSpecialty())
                                .gradeLevel(specialty.getGradeLevel())
                                .build())
                        .toList())
                // Học phí không công khai: chỉ lộ hình thức dạy.
                .teachingModes(prices.stream()
                        .map(price -> price.getTeachingMode().name())
                        .distinct()
                        .toList())
                .availabilities(availabilities.stream()
                        .map(availability -> TutorProfileResponse.AvailabilityResponse.builder()
                                .id(availability.getId())
                                .dayOfWeek(availability.getDayOfWeek().intValue())
                                .timeSlot(availability.getTimeSlot().name())
                                .build())
                        .toList())
                .credentials(credentials.stream()
                        .filter(credential -> Boolean.TRUE.equals(credential.getIsVerified()))
                        .map(credential -> TutorProfileResponse.CredentialResponse.builder()
                                .id(credential.getId())
                                .title(credential.getTitle())
                                .type(credential.getType())
                                .score(credential.getScore())
                                .fileUrl(credential.getFileUrl())
                                .build())
                        .toList())
                .build();
    }
}
