package com.mycompany.englishtutor.shared.api;

import java.util.Collections;
import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Định dạng phân trang chuẩn cho tất cả API theo API_DESIGN.md Mục 2.2.
 * {@code page} bắt đầu từ 0.
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

    public static <S, T> PageResponse<T> from(Page<S> source, Function<S, T> mapper) {
        return of(source.getContent().stream().map(mapper).toList(), source.getNumber(), source.getSize(),
                source.getTotalElements());
    }

    public static <T> PageResponse<T> of(List<T> items, int page, int size, long totalItems) {
        return PageResponse.<T>builder()
                .items(items)
                .page(page)
                .size(size)
                .totalItems(totalItems)
                .totalPages(size == 0 ? 0 : (int) Math.ceil((double) totalItems / size))
                .build();
    }
}
