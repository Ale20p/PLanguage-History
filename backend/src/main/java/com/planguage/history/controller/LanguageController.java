package com.planguage.history.controller;

import com.planguage.history.dto.LanguageDetailDTO;
import com.planguage.history.dto.LanguageSummaryDTO;
import com.planguage.history.service.LanguageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
