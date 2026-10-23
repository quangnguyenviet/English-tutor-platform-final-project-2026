package com.mycompany.englishtutor.shared.api;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Kết quả phân trang dùng chung cho các API danh sách. {@code page} bắt đầu từ 0. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PageResponse<T> {
    List<T> items;
    int page;
    int size;
    long totalItems;
    int totalPages;

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
