package com.mycompany.englishtutor.module.user.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.mycompany.englishtutor.module.user.domain.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByPhone(String phone);

    Optional<User> findByUsername(String username);

    /**
     * Trạng thái hiện tại của tài khoản, đọc từ DB ở mỗi request vì JWT không phản ánh được
     * thay đổi giữa phiên (Admin khóa tài khoản, nhân sự vừa đổi mật khẩu).
     */
    @Query("""
            SELECT u.role AS role, u.status AS status, u.mustChangePassword AS mustChangePassword
            FROM User u WHERE u.username = :username
            """)
    Optional<AccountState> findAccountState(@Param("username") String username);

    interface AccountState {
        String getRole();

        String getStatus();

        boolean getMustChangePassword();
    }
}
