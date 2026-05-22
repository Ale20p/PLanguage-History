package com.planguage.history.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Full detail DTO for the GET /api/v1/languages/{id} endpoint.
 * Populates the "Liquid Glass" modal with all language information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LanguageDetailDTO {
    private String id;
    private String name;
    private LocalDate releaseDate;
    private String website;
    private List<String> paradigms;
    private List<String> creators;
    private String description;
    private String codeSnippet;
    private List<String> influences;    // Languages that influenced this one
    private List<String> influenced;    // Languages this one influenced
}
