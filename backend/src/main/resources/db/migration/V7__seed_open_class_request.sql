-- Add one OPEN request so the public class discovery page has database-backed data.
-- The NOT EXISTS guard keeps the intent explicit if seed scripts are replayed manually.
INSERT INTO class_requests (
    parent_id,
    requested_tutor_id,
    student_id,
    class_requirement,
    teaching_mode,
    price_per_session,
    preferred_schedule,
    tutor_requirement,
    status,
    handled_by
)
SELECT
    s.parent_id,
    NULL,
    s.id,
    'Luyen IELTS tu 5.0 len 6.5, tap trung Speaking va Grammar.',
    'ONLINE',
    300000,
    '2 buoi/tuan, toi thu 3 va thu 6',
    'Gia su IELTS 7.5 tro len, co kinh nghiem day THPT.',
    'OPEN',
    receptionist.id
FROM students s
JOIN users student ON student.id = s.id AND student.username = 'student'
LEFT JOIN users receptionist ON receptionist.username = 'receptionist'
WHERE NOT EXISTS (
    SELECT 1
    FROM class_requests existing
    WHERE existing.status = 'OPEN'
      AND existing.student_id = s.id
      AND existing.class_requirement = 'Luyen IELTS tu 5.0 len 6.5, tap trung Speaking va Grammar.'
);
