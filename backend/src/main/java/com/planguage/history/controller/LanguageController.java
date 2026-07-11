package com.planguage.history.controller;

import com.planguage.history.dto.LanguageDetailDTO;
import com.planguage.history.dto.LanguageSummaryDTO;
import com.planguage.history.service.LanguageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.http.HttpStatus;
import java.util.List;
import java.util.Map;

/**
 * REST controller for language detail and search endpoints.
 */
@RestController
@RequestMapping("/api/v1/languages")
@RequiredArgsConstructor
public class LanguageController {

    private final LanguageService languageService;

    /**
     * GET /api/v1/languages/{id}
     * Returns full language details for the "Liquid Glass" modal.
     */
    @GetMapping("/{id}")
    public ResponseEntity<LanguageDetailDTO> getLanguageById(@PathVariable String id) {
        return languageService.getLanguageDetail(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * PUT /api/v1/languages/{id}
     * Updates an existing language and returns the updated details.
     */
    @PutMapping("/{id}")
    public ResponseEntity<LanguageDetailDTO> updateLanguage(@PathVariable String id, @RequestBody LanguageDetailDTO dto) {
        return languageService.updateLanguage(id, dto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/v1/languages
     * Creates a new language and returns the created details.
     */
    @PostMapping
    public ResponseEntity<?> createLanguage(@RequestBody LanguageDetailDTO dto) {
        try {
            LanguageDetailDTO created = languageService.createLanguage(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/v1/languages/search?q=&paradigm=&era=
     * Returns filtered list of language summaries.
     */
    @GetMapping("/search")
    public ResponseEntity<List<LanguageSummaryDTO>> searchLanguages(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String paradigm,
            @RequestParam(required = false) String era) {

        List<LanguageSummaryDTO> results = languageService.searchLanguages(q, paradigm, era);
        return ResponseEntity.ok(results);
    }
}
