package com.mycompany.englishtutor.module.tutor.service;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.tutor.api.request.TutorProfileRejectRequest;
import com.mycompany.englishtutor.module.tutor.api.response.TutorPendingSummaryResponse;
import com.mycompany.englishtutor.module.tutor.api.response.TutorProfileResponse;
import com.mycompany.englishtutor.module.tutor.domain.Tutor;
import com.mycompany.englishtutor.module.tutor.domain.enums.ProfileStatus;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

/**
 * Nghiệp vụ duyệt hồ sơ gia sư dành cho lễ tân / quản trị viên.
 *
 * <p>Chỉ hồ sơ đang ở trạng thái {@code PENDING} mới được duyệt hoặc từ chối;
 * mọi trạng thái khác bị chặn bằng {@link ErrorCode#TUTOR_PROFILE_NOT_PENDING} (HTTP 409).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminTutorService {

    UserRepository userRepository;
    TutorRepository tutorRepository;
    TutorProfileMapper tutorProfileMapper;

    /**
     * Lấy danh sách hồ sơ đang chờ duyệt, hồ sơ chờ lâu nhất lên đầu.
     *
     * <p>Chỉ trả thông tin tóm tắt (tên, email, SĐT, trường, thời điểm gửi duyệt...)
     * để payload nhẹ. Khi admin cần xem đầy đủ thì gọi {@link #getProfileDetail(Long)}.
     */
    @Transactional(readOnly = true)
    public List<TutorPendingSummaryResponse> getPendingProfiles() {
        List<Tutor> pendingTutors =
                tutorRepository.findPendingByProfileStatus(ProfileStatus.PENDING.name());

        log.info("Fetched {} pending tutor profile(s)", pendingTutors.size());

        return pendingTutors.stream()
                .map(tutor -> tutorProfileMapper.mapToSummary(tutor.getUser(), tutor))
                .toList();
    }

    /**
     * Lấy hồ sơ chi tiết của một gia sư (kèm 5 nhóm dữ liệu con) để admin
     * review trước khi duyệt / từ chối.
     *
     * <p>Không giới hạn trạng thái — admin có thể xem cả hồ sơ đã duyệt hoặc bị từ chối.
     *
     * @throws AppException {@link ErrorCode#TUTOR_PROFILE_NOT_FOUND} nếu hồ sơ không tồn tại
     */
    @Transactional(readOnly = true)
    public TutorProfileResponse getProfileDetail(Long tutorId) {
        Tutor tutor = tutorRepository.findDetailById(tutorId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_PROFILE_NOT_FOUND));

        log.info("Fetched detail of tutor profile, tutorId: {}", tutorId);

        return tutorProfileMapper.mapToResponse(tutor.getUser(), tutor);
    }

    /**
     * Duyệt hồ sơ: {@code PENDING -> ACTIVE}, ghi nhận người duyệt và xoá lý do từ chối cũ (nếu có).
     */
    @Transactional
    public TutorProfileResponse approve(Long tutorId) {
        Long reviewerId = getCurrentUserId();
        Tutor tutor = getPendingTutor(tutorId);

        tutor.setProfileStatus(ProfileStatus.ACTIVE.name());
        tutor.setRejectionReason(null);
        tutor.setReviewedBy(reviewerId);
        tutor.setReviewedAt(OffsetDateTime.now());
        tutorRepository.save(tutor);

        log.info("Tutor profile approved, tutorId: {}, reviewedBy: {}", tutorId, reviewerId);

        return tutorProfileMapper.mapToResponse(tutor.getUser(), tutor);
    }

    /**
     * Từ chối hồ sơ: {@code PENDING -> REJECTED}, lưu lý do để gia sư biết cần sửa gì.
     */
    @Transactional
    public TutorProfileResponse reject(Long tutorId, TutorProfileRejectRequest request) {
        Long reviewerId = getCurrentUserId();
        Tutor tutor = getPendingTutor(tutorId);

        String rejectionReason = request.getRejectionReason().trim();

        tutor.setProfileStatus(ProfileStatus.REJECTED.name());
        tutor.setRejectionReason(rejectionReason);
        tutor.setReviewedBy(reviewerId);
        tutor.setReviewedAt(OffsetDateTime.now());
        tutorRepository.save(tutor);

        log.info("Tutor profile rejected, tutorId: {}, reviewedBy: {}", tutorId, reviewerId);

        return tutorProfileMapper.mapToResponse(tutor.getUser(), tutor);
    }

    /**
     * Lấy hồ sơ theo id và bắt buộc phải đang {@code PENDING}.
     *
     * @throws AppException {@link ErrorCode#TUTOR_PROFILE_NOT_FOUND} nếu không tồn tại,
     *                      {@link ErrorCode#TUTOR_PROFILE_NOT_PENDING} nếu sai trạng thái
     */
    private Tutor getPendingTutor(Long tutorId) {
        Tutor tutor = tutorRepository
                .findById(tutorId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_PROFILE_NOT_FOUND));

        if (!ProfileStatus.PENDING.name().equals(tutor.getProfileStatus())) {
            throw new AppException(ErrorCode.TUTOR_PROFILE_NOT_PENDING);
        }

        return tutor;
    }

    private Long getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        return userRepository
                .findByUsername(username)
                .map(User::getId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }
}
