package com.mycompany.englishtutor.shared.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

class PhoneNumbersTest {

    @Test
    void normalize_allFormats_returnSameNumber() {
        assertEquals("0984453212", PhoneNumbers.normalize("0984453212"));
        assertEquals("0984453212", PhoneNumbers.normalize("84984453212"));
        assertEquals("0984453212", PhoneNumbers.normalize("+84984453212"));
        assertEquals("0984453212", PhoneNumbers.normalize("098 445.32-12"));
        assertEquals("0984453212", PhoneNumbers.normalize("(+84) 984 453 212"));
    }

    @Test
    void normalize_null_returnsNull() {
        assertNull(PhoneNumbers.normalize(null));
    }
}
