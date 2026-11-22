package com.mycompany.englishtutor.module.messaging.api;

import java.util.List;

/** Hồ sơ phụ huynh kèm danh sách con có sẵn (dùng cho form đề xuất và trang cá nhân). */
public record ParentProfileResponse(
        Long parentId,
        String fullName,
        String phone,
        String purpose,
        String province,
        String district,
        String address,
        boolean profileComplete,
        List<ChildItem> children) {

    public record ChildItem(Long studentId, String fullName, String grade) {}
}
