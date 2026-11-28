package com.mycompany.englishtutor.shared.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

class PublicSearchSupportLocationTest {

    @Test
    void wardAndProvinceNeverIncludeStreetAddress() {
        assertEquals("Phường Thanh Xuân, Hà Nội",
                PublicSearchSupport.toGeneralLocation("Phường Thanh Xuân", "Hà Nội", "25 Nguyễn Trãi, Hà Nội"));
    }

    @Test
    void legacyAddressOnlyExposesLastPart() {
        assertEquals("Hà Nội", PublicSearchSupport.toGeneralLocation(null, null, "25 Nguyễn Trãi, Hà Nội"));
    }

    @Test
    void legacyAddressWithoutSafePartIsHidden() {
        assertNull(PublicSearchSupport.toGeneralLocation(null, null, "25 Nguyễn Trãi"));
        assertNull(PublicSearchSupport.toGeneralLocation(null, null, "Tòa A, 25 Nguyễn Trãi"));
    }
}
