package com.mycompany.englishtutor.module.auth.api.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GoogleAuthorizationUrlResponse {
    String authorizationUrl;
}
