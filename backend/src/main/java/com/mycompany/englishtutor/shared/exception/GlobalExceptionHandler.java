package com.mycompany.englishtutor.shared.exception;

import java.util.Map;

import jakarta.validation.ConstraintViolation;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import com.mycompany.englishtutor.shared.api.ApiResponse;

import lombok.extern.slf4j.Slf4j;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private static final String MIN_ATTRIBUTE = "min";

    @ExceptionHandler(value = Exception.class)
    ResponseEntity<ApiResponse> handlingRuntimeException(Exception exception) {
        log.error("Uncategorized exception caught: {} - {}", exception.getClass().getName(), exception.getMessage(), exception);
        ApiResponse apiResponse = new ApiResponse();

        apiResponse.setCode(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode());
        // Return the actual exception message so frontend can display it
        apiResponse.setMessage(exception.getMessage() != null ? exception.getMessage() : ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage());

        return ResponseEntity.badRequest().body(apiResponse);
    }

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse> handlingAppException(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        ApiResponse apiResponse = new ApiResponse();

        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());

        return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
    }

    @ExceptionHandler(value = AccessDeniedException.class)
    ResponseEntity<ApiResponse> handlingAccessDeniedException(AccessDeniedException exception) {
        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;

        return ResponseEntity.status(errorCode.getStatusCode())
                .body(ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .build());
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse> handlingValidation(MethodArgumentNotValidException exception) {
        ApiResponse apiResponse = new ApiResponse();

        var constraintViolation =
                exception.getBindingResult().getAllErrors().getFirst().unwrap(ConstraintViolation.class);

        Map<String, Object> attributes = constraintViolation.getConstraintDescriptor().getAttributes();

        // Try to find the message in ErrorCode enum (custom messages that ARE enum keys)
        String message = exception.getFieldError() != null
                ? exception.getFieldError().getDefaultMessage()
                : constraintViolation.getMessage();

        ErrorCode errorCode = ErrorCode.INVALID_KEY;
        try {
            errorCode = ErrorCode.valueOf(message);
        } catch (IllegalArgumentException e) {
            // Message is a human-readable string, not an enum key — use it directly
            String mappedMessage = mapAttribute(message, attributes);
            apiResponse.setCode(errorCode.getCode());
            apiResponse.setMessage(mappedMessage);
            return ResponseEntity.badRequest().body(apiResponse);
        }

        log.info(attributes.toString());

        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(mapAttribute(errorCode.getMessage(), attributes));

        return ResponseEntity.badRequest().body(apiResponse);
    }

    private String mapAttribute(String message, Map<String, Object> attributes) {
        String minValue = String.valueOf(attributes.get(MIN_ATTRIBUTE));

        return message.replace("{" + MIN_ATTRIBUTE + "}", minValue);
    }
}
