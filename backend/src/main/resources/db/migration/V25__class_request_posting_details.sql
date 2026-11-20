-- Tin đăng "Lớp cần gia sư": bổ sung địa chỉ, yêu cầu giới tính, loại lớp.
-- tutor_requirement (yêu cầu gia sư) và preferred_schedule (thời gian có thể học) đã có từ V5.
ALTER TABLE class_requests
    ADD COLUMN address            VARCHAR(255),
    ADD COLUMN gender_requirement VARCHAR(10),
    ADD COLUMN duration_type      VARCHAR(20);

ALTER TABLE class_requests ADD CONSTRAINT chk_class_requests_gender_req CHECK (
    gender_requirement IS NULL OR gender_requirement IN ('MALE', 'FEMALE', 'ANY')
);
ALTER TABLE class_requests ADD CONSTRAINT chk_class_requests_duration_type CHECK (
    duration_type IS NULL OR duration_type IN ('SHORT_TERM', 'REGULAR')
);
