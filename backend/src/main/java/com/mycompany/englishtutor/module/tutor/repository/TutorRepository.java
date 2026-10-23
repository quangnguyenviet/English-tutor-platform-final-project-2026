package com.mycompany.englishtutor.module.tutor.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.mycompany.englishtutor.module.tutor.domain.Tutor;

@Repository
public interface TutorRepository extends JpaRepository<Tutor, Long>, JpaSpecificationExecutor<Tutor> {

    /** Tìm kiếm công khai có phân trang; nạp kèm {@code user} để tránh N+1. */
    @Override
    @EntityGraph(attributePaths = "user")
    Page<Tutor> findAll(Specification<Tutor> spec, Pageable pageable);

    /**
     * Danh sách hồ sơ đang chờ duyệt, sắp xếp theo thời điểm gửi duyệt tăng dần
     * (hồ sơ chờ lâu nhất lên đầu). Hồ sơ cũ chưa có {@code submitted_at}
     * (dữ liệu tạo trước khi thêm cột) được đẩy xuống cuối bằng {@code NULLS LAST}.
     *
     * <p>Dùng {@code @Query} tường minh vì Spring Data JPA 3.x không hỗ trợ
     * keyword {@code NULLS LAST} trong derived query.
     */
    @EntityGraph(attributePaths = "user")
    @Query("SELECT t FROM Tutor t WHERE t.profileStatus = :profileStatus "
            + "ORDER BY t.submittedAt ASC NULLS LAST, t.id ASC")
    List<Tutor> findPendingByProfileStatus(@Param("profileStatus") String profileStatus);

    /**
     * Lấy một hồ sơ gia sư theo id, nạp kèm {@code user} để tránh N+1.
     */
    @EntityGraph(attributePaths = "user")
    @Query("SELECT t FROM Tutor t WHERE t.id = :id")
    Optional<Tutor> findDetailById(@Param("id") Long id);

    /**
     * Lấy các hồ sơ đã được duyệt để hiển thị công khai.
     */
    @EntityGraph(attributePaths = "user")
    @Query("SELECT t FROM Tutor t WHERE t.profileStatus = :profileStatus ORDER BY t.updatedAt DESC, t.id DESC")
    List<Tutor> findPublicByProfileStatus(@Param("profileStatus") String profileStatus);

    /**
     * Lấy một hồ sơ công khai theo id và trạng thái.
     */
    @EntityGraph(attributePaths = "user")
    @Query("SELECT t FROM Tutor t WHERE t.id = :id AND t.profileStatus = :profileStatus")
    Optional<Tutor> findPublicByIdAndProfileStatus(
            @Param("id") Long id, @Param("profileStatus") String profileStatus);
}
