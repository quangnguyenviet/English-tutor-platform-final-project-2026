package com.mycompany.englishtutor.shared.util;

/** Chuẩn hóa số điện thoại Việt Nam về một dạng lưu trữ duy nhất: {@code 0xxxxxxxxx}. */
public final class PhoneNumbers {

    private PhoneNumbers() {}

    /** Bỏ ký tự phân cách, đổi đầu số {@code +84} hoặc {@code 84} thành {@code 0}. */
    public static String normalize(String phone) {
        if (phone == null) {
            return null;
        }
        String cleaned = phone.replaceAll("[\\s.\\-()]", "");
        if (cleaned.startsWith("+84")) {
            return "0" + cleaned.substring(3);
        }
        if (cleaned.startsWith("84")) {
            return "0" + cleaned.substring(2);
        }
        return cleaned;
    }
}
