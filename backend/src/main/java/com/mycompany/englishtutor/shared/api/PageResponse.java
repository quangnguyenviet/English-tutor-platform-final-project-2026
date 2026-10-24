package com.mycompany.englishtutor.shared.api;

import java.util.Collections;
import java.util.List;

import org.springframework.data.domain.Page;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Định dạng phân trang chuẩn cho tất cả API theo API_DESIGN.md Mục 2.2.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PageResponse<T> {
    @Builder.Default
    List<T> items = Collections.emptyList();
    int page;
    int size;
    long totalItems;
    int totalPages;

    public static <T> PageResponse<T> from(Page<T> page) {
        return PageResponse.<T>builder()
                .items(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalItems(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    public static <E, D> PageResponse<D> from(Page<E> page, java.util.function.Function<E, D> mapper) {
        List<D> mappedItems = page.getContent().stream().map(mapper).toList();
        return PageResponse.<D>builder()
                .items(mappedItems)
                .page(page.getNumber())
                .size(page.getSize())
                .totalItems(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }
}
