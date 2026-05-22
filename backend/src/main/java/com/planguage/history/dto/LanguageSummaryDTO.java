package com.planguage.history.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Lightweight DTO for search results. Only includes fields needed
 * for search result listings, not full modal detail.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LanguageSummaryDTO {
    private String id;
    private String name;
    private int year;
    private List<String> paradigms;
}
