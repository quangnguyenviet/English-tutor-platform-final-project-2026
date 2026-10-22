-- =============================================================================
-- V6: Du lieu mau cho moi truong phat trien
--
-- Flyway tu dong chay file nay sau V5. Tat ca tai khoan moi ben duoi dung chung
-- mat khau: 123456 (BCrypt strength 10).
-- Neu cac tai khoan mac dinh da duoc ApplicationInitConfig tao, migration se
-- giu nguyen tai khoan/mat khau hien tai va chi bo sung du lieu lien quan.
-- =============================================================================

INSERT INTO users (
    username, password_hash, full_name, email, phone, date_of_birth, gender,
    role, status, must_change_password
)
VALUES
    ('admin',
     '$2a$10$X1gIwy20S../Q.pBpFVTMO5HLhnfX13AtCwouq5CpRo5sQ/sHuwZK',
     'Nguyen Minh Admin', 'admin@englishpath.local', '0900000001', '1990-01-15', 'MALE',
     'ADMIN', 'ACTIVE', FALSE),
    ('receptionist',
     '$2a$10$X1gIwy20S../Q.pBpFVTMO5HLhnfX13AtCwouq5CpRo5sQ/sHuwZK',
     'Tran Thu Le Tan', 'receptionist@englishpath.local', '0900000002', '1997-05-20', 'FEMALE',
     'RECEPTIONIST', 'ACTIVE', FALSE),
    ('accountant',
     '$2a$10$X1gIwy20S../Q.pBpFVTMO5HLhnfX13AtCwouq5CpRo5sQ/sHuwZK',
     'Le Hoang Ke Toan', 'accountant@englishpath.local', '0900000003', '1994-08-12', 'MALE',
     'ACCOUNTANT', 'ACTIVE', FALSE),
    ('tutor',
     '$2a$10$X1gIwy20S../Q.pBpFVTMO5HLhnfX13AtCwouq5CpRo5sQ/sHuwZK',
     'Pham Ngoc Gia Su', 'tutor@englishpath.local', '0900000004', '1999-03-08', 'FEMALE',
     'TUTOR', 'ACTIVE', FALSE),
    ('student',
     '$2a$10$X1gIwy20S../Q.pBpFVTMO5HLhnfX13AtCwouq5CpRo5sQ/sHuwZK',
     'Do Anh Hoc Sinh', 'student@englishpath.local', '0900000005', '2010-09-10', 'MALE',
     'STUDENT', 'ACTIVE', FALSE)
ON CONFLICT (username) DO NOTHING;

DO $$
DECLARE
    v_admin_id          BIGINT;
    v_receptionist_id   BIGINT;
    v_accountant_id     BIGINT;
    v_tutor_id          BIGINT;
    v_student_id        BIGINT;
    v_parent_id         BIGINT;
    v_credential_id     BIGINT;
    v_request_id        BIGINT;
    v_class_id          BIGINT;
    v_trial_session_id  BIGINT;
    v_session_id        BIGINT;
    v_skill_grammar_id  BIGINT;
    v_skill_vocab_id    BIGINT;
    v_quiz_id           BIGINT;
    v_question_1_id     BIGINT;
    v_question_2_id     BIGINT;
    v_tutor_payment_id  BIGINT;
    v_parent_payment_id BIGINT;
    v_complaint_id      BIGINT;
    v_refund_id         BIGINT;
BEGIN
    SELECT id INTO STRICT v_admin_id FROM users WHERE username = 'admin';
    SELECT id INTO STRICT v_receptionist_id FROM users WHERE username = 'receptionist';
    SELECT id INTO STRICT v_accountant_id FROM users WHERE username = 'accountant';
    SELECT id INTO STRICT v_tutor_id FROM users WHERE username = 'tutor';
    SELECT id INTO STRICT v_student_id FROM users WHERE username = 'student';

    INSERT INTO employees (id, employee_code, hired_date)
    VALUES
        (v_admin_id, 'EMP-ADMIN-001', '2024-01-02'),
        (v_receptionist_id, 'EMP-REC-001', '2025-02-10'),
        (v_accountant_id, 'EMP-ACC-001', '2025-03-15')
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_parent_id
    FROM parents
    WHERE phone = '0911000001'
    ORDER BY id
    LIMIT 1;

    IF v_parent_id IS NULL THEN
        INSERT INTO parents (full_name, phone, email, address)
        VALUES (
            'Do Van Phu Huynh', '0911000001', 'parent.sample@englishpath.local',
            '123 Nguyen Trai, Thanh Xuan, Ha Noi'
        )
        RETURNING id INTO v_parent_id;
    END IF;

    INSERT INTO students (id, parent_id, school, grade, learning_goal, elo)
    VALUES (
        v_student_id, v_parent_id, 'THPT Viet Duc', 'Lop 10',
        'Cung co ngu phap va dat IELTS 6.5', 1000
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO tutors (
        id, address, hometown, university, education_status, experience_years,
        bio, video_url, profile_status, reviewed_by, reviewed_at, submitted_at
    )
    VALUES (
        v_tutor_id, 'Cau Giay, Ha Noi', 'Nam Dinh',
        'Dai hoc Ngoai ngu - DHQGHN', 'GRADUATED', 4,
        'Gia su tieng Anh giao tiep va luyen thi IELTS.',
        'https://www.youtube.com/watch?v=sample', 'ACTIVE',
        v_receptionist_id, '2026-09-20 09:00:00+07', '2026-09-19 20:00:00+07'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO tutor_credentials (
        tutor_id, credential_type, title, score, description, issued_at,
        file_url, is_verified, verified_by, verified_at
    )
    VALUES (
        v_tutor_id, 'CERTIFICATE', 'IELTS', '8.0',
        'Chung chi IELTS Academic', '2025-06-15',
        'http://localhost:9000/englishpath/sample/ielts-certificate.pdf',
        TRUE, v_receptionist_id, '2026-09-20 09:00:00+07'
    )
    RETURNING id INTO v_credential_id;

    INSERT INTO tutor_specialties (
        tutor_id, specialty, grade_level, credential_id,
        is_verified, verified_by, verified_at
    )
    VALUES
        (v_tutor_id, 'IELTS Speaking', 'THPT', v_credential_id,
         TRUE, v_receptionist_id, '2026-09-20 09:00:00+07'),
        (v_tutor_id, 'Tieng Anh Giao tiep', 'Nguoi di lam', v_credential_id,
         TRUE, v_receptionist_id, '2026-09-20 09:00:00+07');

    INSERT INTO tutor_prices (tutor_id, teaching_mode, price_per_session, program)
    VALUES
        (v_tutor_id, 'ONLINE', 300000, 'IELTS'),
        (v_tutor_id, 'AT_HOME', 400000, 'IELTS');

    INSERT INTO tutor_availabilities (tutor_id, day_of_week, time_slot)
    VALUES
        (v_tutor_id, 2, 'EVENING'),
        (v_tutor_id, 5, 'EVENING'),
        (v_tutor_id, 7, 'MORNING')
    ON CONFLICT DO NOTHING;

    INSERT INTO tutor_service_areas (tutor_id, province, district)
    VALUES
        (v_tutor_id, 'Ha Noi', 'Cau Giay'),
        (v_tutor_id, 'Ha Noi', 'Thanh Xuan');

    INSERT INTO class_requests (
        parent_id, requested_tutor_id, student_id, class_requirement,
        teaching_mode, price_per_session, preferred_schedule,
        tutor_requirement, status, handled_by
    )
    VALUES (
        v_parent_id, NULL, v_student_id,
        'Luyen IELTS tu 5.0 len 6.5, tap trung Speaking va Grammar.',
        'ONLINE', 300000, '2 buoi/tuan, toi thu 3 va thu 6',
        'Gia su IELTS 7.5 tro len, co kinh nghiem day THPT.',
        'MATCHED', v_receptionist_id
    )
    RETURNING id INTO v_request_id;

    INSERT INTO class_applications (class_request_id, tutor_id, message, status, applied_at)
    VALUES (
        v_request_id, v_tutor_id,
        'Toi co 4 nam kinh nghiem luyen thi IELTS cho hoc sinh THPT.',
        'SELECTED', '2026-09-22 19:30:00+07'
    );

    INSERT INTO classes (
        class_request_id, tutor_id, student_id, class_name, status,
        teaching_mode, active_from, price_per_session, tutor_note
    )
    VALUES (
        v_request_id, v_tutor_id, v_student_id,
        'IELTS 6.5 - Anh Hoc Sinh', 'ACTIVE', 'ONLINE', '2026-10-01', 300000,
        'Hoc sinh cham chi, can cai thien phan xa Speaking.'
    )
    RETURNING id INTO v_class_id;

    INSERT INTO class_schedules (class_id, day_of_week, start_time, end_time)
    VALUES
        (v_class_id, 2, '19:00', '20:30'),
        (v_class_id, 5, '19:00', '20:30');

    INSERT INTO sessions (
        class_id, title, session_date, start_time, end_time, is_trial,
        teaching_mode, meeting_url, status, log_knowledge, log_homework
    )
    VALUES (
        v_class_id, 'Buoi hoc thu', '2026-09-25', '19:00', '20:00', TRUE,
        'ONLINE', 'https://meet.google.com/sample-trial', 'COMPLETED',
        'Danh gia trinh do dau vao va muc tieu IELTS.',
        'Hoan thanh bai kiem tra ngu phap dau vao.'
    )
    RETURNING id INTO v_trial_session_id;

    INSERT INTO sessions (
        class_id, title, session_date, start_time, end_time, is_trial,
        teaching_mode, meeting_url, status, log_knowledge, log_homework
    )
    VALUES (
        v_class_id, 'Past Simple va Travel Vocabulary', '2026-10-06',
        '19:00', '20:30', FALSE, 'ONLINE',
        'https://meet.google.com/sample-class', 'COMPLETED',
        'On tap thi qua khu don va tu vung chu de du lich.',
        'Lam quiz va viet doan van 120 tu ve chuyen di gan nhat.'
    )
    RETURNING id INTO v_session_id;

    INSERT INTO session_materials (
        session_id, uploaded_by, file_name, file_url, file_type, file_size
    )
    VALUES (
        v_session_id, v_tutor_id, 'past-simple-travel.pdf',
        'http://localhost:9000/englishpath/sample/past-simple-travel.pdf',
        'PDF', 245760
    );

    INSERT INTO skills (skill_code, skill_name, category, description)
    VALUES (
        'past_simple', 'Thi qua khu don / Past Simple', 'GRAMMAR',
        'Su dung thi qua khu don trong cau ke va cau hoi.'
    )
    RETURNING id INTO v_skill_grammar_id;

    INSERT INTO skills (skill_code, skill_name, category, description)
    VALUES (
        'travel_vocabulary', 'Tu vung du lich / Travel Vocabulary', 'VOCABULARY',
        'Tu vung thong dung ve chuyen di, phuong tien va noi luu tru.'
    )
    RETURNING id INTO v_skill_vocab_id;

    INSERT INTO quizzes (
        session_id, title, status, source, deadline, total_questions
    )
    VALUES (
        v_session_id, 'Quiz Past Simple va Travel', 'COMPLETED', 'AI_DIRECT',
        '2026-10-08 23:59:00+07', 2
    )
    RETURNING id INTO v_quiz_id;

    INSERT INTO quiz_questions (
        quiz_id, question_number, question_text, option_a, option_b,
        option_c, option_d, correct_answer, explanation, cefr_level, skill_id
    )
    VALUES (
        v_quiz_id, 1, 'She ___ to Da Nang last summer.',
        'go', 'goes', 'went', 'gone', 'C',
        'Last summer la dau hieu cua thi qua khu don; go co dang qua khu la went.',
        'A2', v_skill_grammar_id
    )
    RETURNING id INTO v_question_1_id;

    INSERT INTO quiz_questions (
        quiz_id, question_number, question_text, option_a, option_b,
        option_c, option_d, correct_answer, explanation, cefr_level, skill_id
    )
    VALUES (
        v_quiz_id, 2, 'Which word means a place where tourists stay overnight?',
        'Accommodation', 'Destination', 'Luggage', 'Departure', 'A',
        'Accommodation means a place to stay, such as a hotel or hostel.',
        'B1', v_skill_vocab_id
    )
    RETURNING id INTO v_question_2_id;

    INSERT INTO quiz_answers (
        question_id, student_id, selected_answer, is_correct,
        elo_before, elo_after, elo_change, next_review, review_count, easiness_factor,
        answered_at
    )
    VALUES
        (v_question_1_id, v_student_id, 'C', TRUE,
         1000, 1016, 16, NULL, 0, 2.50, '2026-10-07 20:00:00+07'),
        (v_question_2_id, v_student_id, 'C', FALSE,
         1016, 1000, -16, '2026-10-23 20:00:00+07', 0, 2.30,
         '2026-10-07 20:02:00+07');

    INSERT INTO payments (
        class_id, payer_type, fee_percentage, amount, payment_method,
        proof_url, received_amount, status, uploaded_by, uploaded_at,
        reviewed_by, reviewed_at
    )
    VALUES (
        v_class_id, 'TUTOR', 40.00, 960000, 'BANK_TRANSFER',
        'http://localhost:9000/englishpath/sample/payment-proof.jpg',
        960000, 'APPROVED', v_tutor_id, '2026-10-01 10:00:00+07',
        v_accountant_id, '2026-10-01 14:30:00+07'
    )
    RETURNING id INTO v_tutor_payment_id;

    INSERT INTO payments (
        class_id, payer_type, fee_percentage, amount, payment_method,
        proof_url, received_amount, status, uploaded_by, uploaded_at,
        reviewed_by, reviewed_at
    )
    VALUES (
        v_class_id, 'PARENT', NULL, 2400000, 'CASH',
        'http://localhost:9000/englishpath/sample/tuition-receipt.jpg',
        2400000, 'APPROVED', v_receptionist_id, '2026-10-01 11:00:00+07',
        v_accountant_id, '2026-10-01 14:35:00+07'
    )
    RETURNING id INTO v_parent_payment_id;

    INSERT INTO complaints (
        class_id, complainant_name, complainant_phone, complainant_role,
        complaint_type, complaint_content, status, resolution,
        received_by, resolved_by, resolved_at
    )
    VALUES (
        v_class_id, 'Do Van Phu Huynh', '0911000001', 'PARENT',
        'REFUND', 'De nghi hoan mot phan hoc phi do thay doi lich hoc.',
        'RESOLVED', 'Da hoan 300000 VND theo thoa thuan.',
        v_receptionist_id, v_accountant_id, '2026-10-15 16:00:00+07'
    )
    RETURNING id INTO v_complaint_id;

    INSERT INTO complaint_attachments (
        complaint_id, file_url, file_name, uploaded_by
    )
    VALUES (
        v_complaint_id,
        'http://localhost:9000/englishpath/sample/complaint-evidence.jpg',
        'complaint-evidence.jpg', v_receptionist_id
    );

    INSERT INTO refunds (
        complaint_id, payment_id, requested_amount, approved_amount,
        recipient_name, bank_name, bank_account_number, status,
        proof_url, requested_by, processed_by, processed_at
    )
    VALUES (
        v_complaint_id, v_parent_payment_id, 300000, 300000,
        'Do Van Phu Huynh', 'Vietcombank', '0123456789', 'PAID',
        'http://localhost:9000/englishpath/sample/refund-proof.jpg',
        v_receptionist_id, v_accountant_id, '2026-10-15 16:00:00+07'
    )
    RETURNING id INTO v_refund_id;

    INSERT INTO notifications (
        user_id, title, content, link_url, link_entity_type, link_entity_id, is_read
    )
    VALUES
        (v_student_id, 'Co quiz moi can on tap',
         'Hay xem lai cau sai ve Travel Vocabulary.',
         '/student/quizzes/' || v_quiz_id, 'QUIZ', v_quiz_id, FALSE),
        (v_tutor_id, 'Khoan phi da duoc xac nhan',
         'Ke toan da xac nhan phi nhan lop.',
         '/tutor/payments/' || v_tutor_payment_id, 'PAYMENT', v_tutor_payment_id, TRUE);

    INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id, details, ip_address, created_at
    )
    VALUES
        (v_receptionist_id, 'APPROVE_TUTOR', 'TUTOR', v_tutor_id,
         jsonb_build_object('profileStatus', 'ACTIVE'), '127.0.0.1',
         '2026-09-20 09:00:00+07'),
        (v_accountant_id, 'APPROVE_PAYMENT', 'PAYMENT', v_tutor_payment_id,
         jsonb_build_object('receivedAmount', 960000), '127.0.0.1',
         '2026-10-01 14:30:00+07'),
        (v_accountant_id, 'PAY_REFUND', 'REFUND', v_refund_id,
         jsonb_build_object('approvedAmount', 300000), '127.0.0.1',
         '2026-10-15 16:00:00+07');
END $$;
